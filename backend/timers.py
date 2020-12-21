from threading import Timer


class GameSessionTimer:
    def __init__(self, interactor):
        self.interactor = interactor
        self.question_timer = None

    def question_chosen(self, game_session_id):
        self.question_timer = Timer(10, self.interactor.question_timeout, args=(game_session_id,))
        self.question_timer.start()

    def player_answered(self, game_session_id, is_correct=True):
        self.question_timer.cancel()
        if not is_correct:
            self.question_chosen(game_session_id)
