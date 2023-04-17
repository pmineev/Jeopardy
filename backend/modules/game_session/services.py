from typing import List

from backend.modules.game.repos import game_repo
from backend.modules.game_session.dtos import GameStateDTO, GameSessionDescriptionDTO
from backend.modules.game_session.entities import GameSession
from backend.modules.game_session.events import GameSessionCreatedEvent, GameSessionDeletedEvent
from backend.modules.game_session.exceptions import AlreadyPlaying, AlreadyCreated, GameSessionNotFound
from backend.modules.game_session.repos import game_session_repo
from backend.modules.user.repos import user_repo


class GameSessionService:
    repo = game_session_repo
    game_repo = game_repo
    user_repo = user_repo

    def get_game_state(self, username: str) -> GameStateDTO:
        user = self.user_repo.get(username)
        if user.is_playing:
            game_session = self.repo.get_by_player(user)
        elif user.is_hosting:
            game_session = self.repo.get(user.hosted_game_session_id)
        else:
            raise GameSessionNotFound()

        return GameStateDTO(game_session)

    def create(self, game_session_data, username: str) -> GameStateDTO:
        user = self.user_repo.get(username)

        if user.is_playing or user.is_hosting:
            raise AlreadyPlaying

        if self.repo.is_exists(user):
            raise AlreadyCreated

        game = self.game_repo.get(game_session_data['game_name'])

        game_session = GameSession(creator=user,
                                   host=user if game_session_data['is_host'] else None,
                                   game=game,
                                   max_players=game_session_data['max_players'])

        game_session.add_event(GameSessionCreatedEvent(game_session))

        print(f'{username} has created gs')

        game_session = self.repo.save(game_session)

        return GameStateDTO(game_session)

    def get_all_descriptions(self, username: str) -> List[GameSessionDescriptionDTO]:
        user = self.user_repo.get(username)

        game_sessions = self.repo.get_all()

        left_gs_ids = [id for id in user.game_sessions if id != user.game_session_id]

        return [GameSessionDescriptionDTO(gs,
                                          gs.id == user.game_session_id,
                                          gs.id in left_gs_ids) for gs in game_sessions]

    def join(self, username: str, join_data):
        user = self.user_repo.get(username)

        game_session = self.repo.get_by_creator(join_data['creator'])

        if not (user.is_playing or user.is_hosting):
            game_session.join(user)

            game_session = self.repo.save(game_session)
        elif user.game_session_id != game_session.id:
            raise AlreadyPlaying

        return GameStateDTO(game_session)

    def leave(self, username: str):  # TODO сообщать игрокам о выходе ведущего
        user = self.user_repo.get(username)
        if user.is_playing:
            game_session = self.repo.get_by_player(user)
        elif user.is_hosting:
            game_session = self.repo.get(user.hosted_game_session_id)
        else:
            raise GameSessionNotFound()

        if not user.is_hosting:
            game_session.leave(user)

        if user.is_hosting or not game_session.is_hosted and game_session.is_all_players_left():
            game_session.add_event(GameSessionDeletedEvent(game_session))

            print('gs deleted')

            self.repo.delete(game_session)
        else:
            self.repo.save(game_session)

    def start(self, username: str):
        user = self.user_repo.get(username)

        if user.is_hosting:
            game_session = self.repo.get(user.hosted_game_session_id)
            game_session.start_game()

            self.repo.save(game_session)
        else:
            raise GameSessionNotFound()

    def choose_question(self, username: str, question_data):
        user = self.user_repo.get(username)
        game_session = self.repo.get_by_player(user)

        theme_index = question_data['theme_index']
        question_index = question_data['question_index']

        game_session.choose_question(user, theme_index, question_index)

        self.repo.save(game_session)

    def allow_answers(self, username: str):
        user = self.user_repo.get(username)

        if user.is_hosting:
            game_session = self.repo.get(user.hosted_game_session_id)
            game_session.allow_answers()

            self.repo.save(game_session)
        else:
            raise GameSessionNotFound()

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
        game_session = self.repo.get_by_player(user)

        game_session.submit_answer(user, answer_data['answer'] if answer_data else None)

        self.repo.save(game_session)
