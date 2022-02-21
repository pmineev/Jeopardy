class GameSessionNotFound(Exception):
    code = 'game_session_not_found'


class TooManyPlayers(Exception):
    code = 'too_many_players'


class NotCurrentPlayer(Exception):
    code = 'not_current_player'


class WrongQuestionRequest(Exception):
    code = 'wrong_question_request'


class AlreadyPlaying(Exception):
    code = 'already_playing'


class WrongStage(Exception):
    code = 'wrong_stage'
