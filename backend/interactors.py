from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from backend.repos import GameSessionRepo, UserRepo, GameRepo

from backend.entities import User, Game, Round, Theme, Question, GameSession
from backend.dtos import GameSessionIdDTO, GameStateDTO, GameSessionDescriptionDTO, GameDescriptionDTO, UserDTO, \
    SessionDTO
from backend.events import GameSessionDeletedEvent, GameSessionCreatedEvent
from backend.exceptions import NotPlayer, UserAlreadyExists, UserNotFound, GameAlreadyExists, AlreadyPlaying


class UserInteractor:
    def __init__(self, repo: 'UserRepo'):
        self.repo = repo

    def get(self, username: str) -> UserDTO:
        if not self.repo.is_exists(username):
            raise UserNotFound

        user = self.repo.get(username)

        return UserDTO(user)

    def create(self, user_data):
        if self.repo.is_exists(user_data['username']):
            raise UserAlreadyExists

        user = User(**user_data)

        self.repo.save(user)

    def update(self, user_data, username: str):
        if not self.repo.is_exists(username):
            raise UserNotFound

        user = self.repo.get(username)

        if 'nickname' in user_data:
            user.nickname = user_data['nickname']

        if 'password' in user_data:
            user.password = user_data['password']

        self.repo.save(user)

    def authenticate(self, user_data) -> SessionDTO:
        user = User(**user_data)

        session = self.repo.authenticate(user)

        return SessionDTO(session)


class GameInteractor:
    def __init__(self, repo: 'GameRepo', user_repo: 'UserRepo'):
        self.repo = repo
        self.user_repo = user_repo

    def create(self, game_data, username: str):
        if not self.user_repo.is_exists(username):
            raise UserNotFound

        user = self.user_repo.get(username)

        if self.repo.is_exists(game_data['name']):
            raise GameAlreadyExists

        rounds = list()

        for round_index, round_data in enumerate(game_data['rounds']):  # TODO выделить создание сущностей
            themes = list()

            for theme_data in round_data['themes']:
                questions = list()

                for question_data in theme_data['questions']:
                    questions.append(Question(text=question_data['text'],
                                              answer=question_data['answer'],
                                              value=question_data['value']))

                themes.append(Theme(name=theme_data['name'],
                                    questions=questions))

            rounds.append(Round(order=round_index + 1,
                                themes=themes))

        final_round_data = game_data['final_round']
        final_round = Question(text=final_round_data['text'],
                               answer=final_round_data['answer'],
                               value=final_round_data['value'])

        game = Game(name=game_data['name'],
                    author=user,
                    rounds=rounds,
                    final_round=final_round)

        self.repo.save(game)

    def get_all_descriptions(self) -> List[GameDescriptionDTO]:
        games = self.repo.get_all()

        return [GameDescriptionDTO(game) for game in games]


class GameSessionInteractor:
    def __init__(self, repo: 'GameSessionRepo', game_repo: 'GameRepo', user_repo: 'UserRepo'):
        self.repo = repo
        self.game_repo = game_repo
        self.user_repo = user_repo

    def get_game_session_id(self, username: str) -> GameSessionIdDTO:
        user = self.user_repo.get(username)

        game_session = self.repo.get_by_user(user)

        return GameSessionIdDTO(game_session)

    def get_game_state(self, game_session_id: int, username: str) -> GameStateDTO:
        game_session = self.repo.get(game_session_id)
        user = self.user_repo.get(username)

        if not game_session.is_player(user):
            raise NotPlayer

        return GameStateDTO(game_session)

    def create(self, game_session_data, username: str) -> GameStateDTO:
        user = self.user_repo.get(username)

        if self.repo.is_exists(user):
            raise AlreadyPlaying

        game = self.game_repo.get(game_session_data['game_name'])

        game_session = GameSession(creator=user,
                                   game=game,
                                   max_players=game_session_data['max_players'])

        game_session.add_event(GameSessionCreatedEvent(game_session))

        print(f'{username} has created gs')

        self.repo.save(game_session)

        return GameStateDTO(game_session)

    def get_all_descriptions(self) -> List[GameSessionDescriptionDTO]:
        game_sessions = self.repo.get_all()

        return [GameSessionDescriptionDTO(game_session) for game_session in game_sessions]

    def join(self, game_session_id: int, username: str) -> GameStateDTO:
        game_session = self.repo.get(game_session_id)
        user = self.user_repo.get(username)

        # TODO добавить в бд ограничение: пользователь может быть игроком только в одной игре

        game_session.join(user)

        self.repo.save(game_session)

        return GameStateDTO(game_session)

    def leave(self, game_session_id: int, username: str):
        game_session = self.repo.get(game_session_id)
        user = self.user_repo.get(username)

        game_session.leave(user)

        if game_session.is_all_players_left():
            game_session.add_event(GameSessionDeletedEvent(game_session))

            print('gs deleted')

            self.repo.delete(game_session)
        else:
            self.repo.save(game_session)

    def choose_question(self, game_session_id: int, question_data, username: str):
        game_session: GameSession = self.repo.get(game_session_id)
        user = self.user_repo.get(username)

        theme_index = question_data['theme_index']
        question_index = question_data['question_index']

        game_session.choose_question(user, theme_index, question_index)

        self.repo.save(game_session)

    def answer_timeout(self, game_session_id: int):
        game_session = self.repo.get(game_session_id)

        print(f'question timeout, current player: {game_session.current_player.user.username}')

        game_session.answer_timeout()

        self.repo.save(game_session)

    def final_round_timeout(self, game_session_id: int):
        game_session = self.repo.get(game_session_id)

        game_session.final_round_timeout()

        self.repo.delete(game_session)

        print('game ended')

    def submit_answer(self, game_session_id: int, username: str, answer_data):
        game_session: GameSession = self.repo.get(game_session_id)
        user = self.user_repo.get(username)

        game_session.submit_answer(user, answer_data['answer'])

        self.repo.save(game_session)
