class GameSessionNotFound(Exception):
    error = 'game_session_not_found'


class TooManyPlayers(Exception):
    error = 'too_many_players'


class NotCurrentPlayer(Exception):
    error = 'not_current_player'


class WrongQuestionRequest(Exception):
    error = 'wrong_question_request'


class AlreadyPlaying(Exception):
    error = 'already_playing'


class WrongStage(Exception):
    error = 'wrong_stage'
