from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..game.entities import Round
    from ..game_session.entities import CurrentQuestion
    from .entities import GameSession, Player

from ...core.events import Event


class GameSessionCreatedEvent(Event):
    def __init__(self, game_session: 'GameSession'):
        self.game_session = game_session


class GameSessionDeletedEvent(Event):
    def __init__(self, game_session: 'GameSession'):
        self.game_session = game_session


class PlayerJoinedEvent(Event):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        self.game_session = game_session
        self.player = player


class PlayerLeftEvent(Event):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        self.game_session = game_session
        self.player = player


class RoundStartedEvent(Event):
    def __init__(self, game_session: 'GameSession', round: 'Round'):
        self.game_session = game_session
        self.round = round


class CurrentPlayerChosenEvent(Event):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        self.game_session = game_session
        self.player = player


class CurrentQuestionChosenEvent(Event):
    def __init__(self, game_session: 'GameSession', question: 'CurrentQuestion'):
        self.game_session = game_session
        self.question = question


class PlayerCorrectlyAnsweredEvent(Event):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        self.game_session = game_session
        self.player = player


class PlayerIncorrectlyAnsweredEvent(Event):
    def __init__(self, game_session: 'GameSession', player: 'Player'):
        self.game_session = game_session
        self.player = player


class FinalRoundStartedEvent(Event):
    def __init__(self, game_session: 'GameSession'):
        self.game_session = game_session
        self.final_round = game_session.game.final_round


class AnswerTimeoutEvent(Event):
    def __init__(self, game_session: 'GameSession', question: 'CurrentQuestion'):
        self.game_session = game_session
        self.question = question


class FinalRoundTimeoutEvent(Event):
    def __init__(self, game_session: 'GameSession'):
        self.game_session = game_session
