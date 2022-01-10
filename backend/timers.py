from threading import Timer
from typing import Callable, Tuple, Dict, TYPE_CHECKING

if TYPE_CHECKING:
    from backend.events import PlayerIncorrectlyAnsweredEvent, FinalRoundStartedEvent, \
        PlayerCorrectlyAnsweredEvent, CurrentQuestionChosenEvent

import backend.factories as factories

CHOOSING_QUESTION_INTERVAL = 10
FINAL_ROUND_INTERVAL = 30


class Timers:
    _timers: Dict[int, Timer] = dict()

    @staticmethod
    def start(key, interval: int, callback: Callable, args: Tuple):
        timer = Timer(interval, callback, args)
        timer.start()

        Timers._timers[key] = timer

    @staticmethod
    def stop(key):
        timer = Timers._timers.pop(key)
        timer.cancel()


def start_question_timer(event: 'CurrentQuestionChosenEvent'):
    gs = event.game_session
    interactor = factories.GameSessionFactory.get()

    Timers.start(key=gs.id,
                 interval=CHOOSING_QUESTION_INTERVAL,
                 callback=interactor.answer_timeout,
                 args=(gs.id,))


def stop_question_timer(event: 'PlayerCorrectlyAnsweredEvent'):
    gs = event.game_session

    Timers.stop(gs.id)


def restart_question_timer(event: 'PlayerIncorrectlyAnsweredEvent'):
    gs = event.game_session
    interactor = factories.GameSessionFactory.get()

    Timers.stop(gs.id)
    Timers.start(key=gs.id,
                 interval=CHOOSING_QUESTION_INTERVAL,
                 callback=interactor.answer_timeout,
                 args=(gs.id,))


def start_final_round_timer(event: 'FinalRoundStartedEvent'):
    gs = event.game_session
    interactor = factories.GameSessionFactory.get()

    Timers.start(key=gs.id,
                 interval=FINAL_ROUND_INTERVAL,
                 callback=interactor.final_round_timeout,
                 args=(gs.id,))
