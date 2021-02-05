from dataclasses import dataclass
from typing import List

from backend.enums import State


@dataclass
class UserProfile:
    username: str
    nickname: str = None
    password: str = None


@dataclass
class Player:
    nickname: str
    score: int = 0
    is_playing: bool = True
    answer: str = None


@dataclass
class Session:
    access: str
    refresh: str = None


@dataclass
class Question:
    text: str
    order: int = None
    answer: str = None
    value: int = None


@dataclass
class Theme:
    name: str
    questions: List[Question]
    order: int = None


@dataclass
class Round:
    order: int
    themes: List[Theme]


@dataclass
class Game:
    name: str
    author: UserProfile = None
    rounds: List[Round] = None
    final_round: Question = None


@dataclass
class GameDescription:
    name: str
    author: str
    rounds_count: int


@dataclass
class GameSession:
    creator: UserProfile
    game: Game
    max_players: int
    state: State = State.WAITING
    players: List[Player] = None
    current_player: Player = None
    current_round: Round = None
    current_question: Question = None


@dataclass
class GameSessionDescription:
    id: int
    creator: str
    game_name: str
    max_players: int
    current_players: int
    players: List[Player] = None


@dataclass
class QuestionDescription:
    value: int
    text: str = None


@dataclass
class ThemeDescription:
    name: str
    questions: List[QuestionDescription]


@dataclass
class RoundDescription:
    order: int
    themes: List[ThemeDescription]
