from dataclasses import dataclass
from typing import List


@dataclass
class UserProfile:
    username: str
    nickname: str = None
    password: str = None


@dataclass
class Question:
    text: str
    order: int = None
    answer: str = None


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
    players: List[UserProfile] = None
