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
