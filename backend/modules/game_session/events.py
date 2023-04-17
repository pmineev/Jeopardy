from abc import ABC
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..game.entities import Round
    from ..game_session.entities import CurrentQuestion
    from .entities import GameSession, Player

from backend.core.events import Event
from backend.modules.game_session.dtos import GameSessionDescriptionDTO, CreatorNicknameDTO, PlayerNicknameDTO, \
    CurrentQuestionDTO, PlayerDTO, FinalRoundQuestionDTO, CorrectAnswerDTO, FinalRoundTimeoutDTO, RoundStartedDTO


class GameSessionEvent(Event, ABC):
    def __init__(self, game_session):
        self._game_session = game_session

    @property
    def game_session_id(self):
        return self._game_session.id


class GameSessionCreatedEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession'):
        super().__init__(game_session)
        self.creator_username = game_session.creator.username

        self.game_session_description_dto = GameSessionDescriptionDTO(game_session, False, False).to_response()


class GameSessionDeletedEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession'):
        super().__init__(game_session)

        self.creator_nickname_dto = CreatorNicknameDTO(game_session.creator).to_response()


class PlayerJoinedEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        super().__init__(game_session)
        self.player_username = player.username

        self.creator_nickname_dto = CreatorNicknameDTO(game_session.creator).to_response()
        self.player_nickname_dto = PlayerNicknameDTO(player).to_response()


class PlayerActiveEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        super().__init__(game_session)
        self.player_username = player.username

        self.player_nickname_dto = PlayerNicknameDTO(player).to_response()


class PlayerLeftEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        super().__init__(game_session)
        self.player_username = player.username

        self.creator_nickname_dto = CreatorNicknameDTO(game_session.creator).to_response()
        self.player_nickname_dto = PlayerNicknameDTO(player).to_response()


class PlayerInactiveEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        super().__init__(game_session)

        self.player_nickname_dto = PlayerNicknameDTO(player).to_response()


class RoundStartedEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession', round: 'Round', current_player: 'Player'):
        super().__init__(game_session)

        self.round_started_dto = RoundStartedDTO(round, current_player).to_response()


class CurrentQuestionChosenEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession', question: 'CurrentQuestion'):
        super().__init__(game_session)

        self.current_question_dto = CurrentQuestionDTO(question).to_response()


class AnswersAllowedEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession'):
        super().__init__(game_session)


class StartAnswerPeriodEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession'):
        super().__init__(game_session)


class PlayerCorrectlyAnsweredEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        super().__init__(game_session)

        self.player_dto = PlayerDTO(player).to_response()


class PlayerIncorrectlyAnsweredEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        super().__init__(game_session)

        self.player_dto = PlayerDTO(player).to_response()


class FinalRoundStartedEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession'):
        super().__init__(game_session)

        self.final_round_dto = FinalRoundQuestionDTO(game_session.game.final_round,
                                                     with_answer=False).to_response()


class AnswerTimeoutEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession', question: 'CurrentQuestion'):
        super().__init__(game_session)

        self.answer_dto = CorrectAnswerDTO(question).to_response()


class FinalRoundTimeoutEvent(GameSessionEvent):
    def __init__(self, game_session: 'GameSession'):
        super().__init__(game_session)

        self.final_round_timeout_dto = FinalRoundTimeoutDTO(game_session).to_response()
