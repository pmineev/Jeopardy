from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..game.entities import Round
    from ..game_session.entities import CurrentQuestion
    from .entities import GameSession, Player

from backend.core.events import Event
from backend.modules.game_session.dtos import GameSessionDescriptionDTO, CreatorNicknameDTO, PlayerNicknameDTO, \
    CurrentQuestionDTO, PlayerDTO, FinalRoundQuestionDTO, CorrectAnswerDTO, FinalRoundTimeoutDTO, RoundStartedDTO


class GameSessionCreatedEvent(Event):
    def __init__(self, game_session: 'GameSession'):
        self.game_session_id = game_session.id
        self.creator_username = game_session.creator.username

        self.game_session_description_dto = GameSessionDescriptionDTO(game_session, False).to_response()


class GameSessionDeletedEvent(Event):
    def __init__(self, game_session: 'GameSession'):
        self.game_session_id = game_session.id

        self.creator_nickname_dto = CreatorNicknameDTO(game_session.creator).to_response()


class PlayerJoinedEvent(Event):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        self.game_session_id = game_session.id
        self.player_username = player.username

        self.creator_nickname_dto = CreatorNicknameDTO(game_session.creator).to_response()
        self.player_nickname_dto = PlayerNicknameDTO(player).to_response()


class PlayerActiveEvent(Event):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        self.game_session_id = game_session.id
        self.player_username = player.username

        self.player_nickname_dto = PlayerNicknameDTO(player).to_response()


class PlayerLeftEvent(Event):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        self.game_session_id = game_session.id
        self.player_username = player.username

        self.creator_nickname_dto = CreatorNicknameDTO(game_session.creator).to_response()
        self.player_nickname_dto = PlayerNicknameDTO(player).to_response()


class PlayerInactiveEvent(Event):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        self.game_session_id = game_session.id

        self.player_nickname_dto = PlayerNicknameDTO(player).to_response()


class RoundStartedEvent(Event):
    def __init__(self, game_session: 'GameSession', round: 'Round', current_player: 'Player'):
        self.game_session_id = game_session.id

        self.round_started_dto = RoundStartedDTO(round, current_player).to_response()


class CurrentQuestionChosenEvent(Event):
    def __init__(self, game_session: 'GameSession', question: 'CurrentQuestion'):
        self.game_session_id = game_session.id

        self.current_question_dto = CurrentQuestionDTO(question).to_response()


class PlayerCorrectlyAnsweredEvent(Event):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        self.game_session_id = game_session.id

        self.player_dto = PlayerDTO(player).to_response()


class PlayerIncorrectlyAnsweredEvent(Event):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        self.game_session_id = game_session.id

        self.player_dto = PlayerDTO(player).to_response()


class FinalRoundStartedEvent(Event):
    def __init__(self, game_session: 'GameSession'):
        self.game_session_id = game_session.id

        self.final_round_dto = FinalRoundQuestionDTO(game_session.game.final_round,
                                                     with_answer=False).to_response()


class AnswerTimeoutEvent(Event):
    def __init__(self, game_session: 'GameSession', question: 'CurrentQuestion'):
        self.game_session_id = game_session.id

        self.answer_dto = CorrectAnswerDTO(question).to_response()


class FinalRoundTimeoutEvent(Event):
    def __init__(self, game_session: 'GameSession'):
        self.game_session_id = game_session.id
        self.final_round_timeout_dto = FinalRoundTimeoutDTO(game_session).to_response()
