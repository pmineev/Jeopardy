class UserAlreadyExists(Exception):
    pass


class GameAlreadyExists(Exception):
    pass


class UserNotFound(Exception):
    pass


class InvalidCredentials(Exception):
    pass


class InvalidGameData(Exception):
    pass


class TooManyPlayers(Exception):
    pass


class NotPlayer(Exception):
    pass


class NotCurrentPlayer(Exception):
    pass


class WrongQuestionRequest(Exception):
    pass
