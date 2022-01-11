class UserAlreadyExists(Exception):
    pass


class GameAlreadyExists(Exception):
    pass


class UserNotFound(Exception):
    pass


class GameNotFound(Exception):
    pass


class InvalidCredentials(Exception):
    pass


class InvalidGameData(Exception):
    pass


class GameSessionNotFound(Exception):
    pass


class TooManyPlayers(Exception):
    pass


class NotCurrentPlayer(Exception):
    pass


class WrongQuestionRequest(Exception):
    pass


class AlreadyPlaying(Exception):
    pass


class WrongStage(Exception):
    pass
