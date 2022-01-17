from threading import Timer
from typing import Callable, Tuple, Dict

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
