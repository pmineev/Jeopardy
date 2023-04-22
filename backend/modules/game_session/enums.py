from enum import Enum


class Stage(Enum):
    WAITING = 'WAITING'
    ROUND_STARTED = 'ROUND_STARTED'
    CHOOSING_QUESTION = 'CHOOSING_QUESTION'
    READING_QUESTION = 'READING_QUESTION'
    ANSWERING = 'ANSWERING'
    PLAYER_ANSWERING = 'PLAYER_ANSWERING'
    FINAL_ROUND = 'FINAL_ROUND'
    END_GAME = 'END_GAME'
