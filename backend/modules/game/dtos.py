from dataclasses import dataclass
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from .entities import Game

from backend.core.dtos import ResponseDTO


class GameDescriptionDTO(ResponseDTO):
    def __init__(self, game: 'Game'):
        self.name = game.name
        self.author = game.author.nickname
        self.rounds_count = len(game.rounds) + 1

    def to_response(self):
        return dict(
            name=self.name,
            author=self.author,
            roundsCount=self.rounds_count
        )


@dataclass
class CreateQuestionDTO:
    text: str
    answer: str
    value: int


@dataclass
class CreateThemeDTO:
    name: str
    questions: List[CreateQuestionDTO]

    def __init__(self, name, questions):
        self.name = name
        self.questions = [CreateQuestionDTO(**q) for q in questions]


@dataclass
class CreateRoundDTO:
    themes: List[CreateThemeDTO]

    def __init__(self, themes):
        self.themes = [CreateThemeDTO(**t) for t in themes]


@dataclass
class CreateGameDTO:
    name: str
    rounds: List[CreateRoundDTO]
    final_round: CreateQuestionDTO

    def __init__(self, name, rounds, final_round):
        self.name = name
        self.rounds = [CreateRoundDTO(**r) for r in rounds]
        self.final_round = CreateQuestionDTO(**final_round)
