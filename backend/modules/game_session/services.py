from typing import List

from backend.modules.game.repos import game_repo
from backend.modules.game_session.dtos import GameStateDTO, GameSessionDescriptionDTO
from backend.modules.game_session.entities import GameSession
from backend.modules.game_session.events import GameSessionCreatedEvent, GameSessionDeletedEvent
from backend.modules.game_session.exceptions import AlreadyPlaying
from backend.modules.game_session.repos import game_session_repo
from backend.modules.user.repos import user_repo


class GameSessionService:
    repo = game_session_repo
    game_repo = game_repo
    user_repo = user_repo

    def get_game_state(self, username: str) -> GameStateDTO:
        user = self.user_repo.get(username)
        game_session = self.repo.get_by_user(user)

        return GameStateDTO(game_session)

    def create(self, game_session_data, username: str) -> GameStateDTO:
        user = self.user_repo.get(username)

        if self.repo.is_exists(user):
            raise AlreadyPlaying

        game = self.game_repo.get(game_session_data['game_name'])

        game_session = GameSession(creator=user,
                                   game=game,
                                   max_players=game_session_data['max_players'])

        game_session = self.repo.save(game_session)  # для присвоения id

        game_session.add_event(GameSessionCreatedEvent(game_session))

        print(f'{username} has created gs')

        game_session = self.repo.save(game_session)

        return GameStateDTO(game_session)

    def get_all_descriptions(self) -> List[GameSessionDescriptionDTO]:
        game_sessions = self.repo.get_all()

        return [GameSessionDescriptionDTO(game_session) for game_session in game_sessions]

    def join(self, username: str, join_data):
        user = self.user_repo.get(username)

        if self.repo.is_exists(user):
            raise AlreadyPlaying

        creator_nickname = join_data['creator']

        game_session = self.repo.get_by_creator(creator_nickname)

        game_session.join(user)

        game_session = self.repo.save(game_session)

        return GameStateDTO(game_session)

    def leave(self, username: str):
        user = self.user_repo.get(username)
        game_session = self.repo.get_by_user(user)

        game_session.leave(user)

        if game_session.is_all_players_left():
            game_session.add_event(GameSessionDeletedEvent(game_session))

            print('gs deleted')

            self.repo.delete(game_session)
        else:
            self.repo.save(game_session)

    def choose_question(self, username: str, question_data):
        user = self.user_repo.get(username)
        game_session = self.repo.get_by_user(user)

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

        game_session.add_event(GameSessionDeletedEvent(game_session))

        self.repo.delete(game_session)

        print('game ended')

    def submit_answer(self, username: str, answer_data):
        user = self.user_repo.get(username)
        game_session = self.repo.get_by_user(user)

        game_session.submit_answer(user, answer_data['answer'])

        self.repo.save(game_session)