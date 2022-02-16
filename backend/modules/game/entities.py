from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..user.entities import User

from backend.core.entities import Entity


class Question(Entity):
    def __init__(self,
                 text: str,
                 answer: str,
                 value: int,
                 id: Optional[int] = None):
        super().__init__(id)
        self.text = text
        self.answer = answer
        self.value = value


class Theme(Entity):
    def __init__(self,
                 name: str,
                 questions: List[Question],
                 id: Optional[int] = None):
        super().__init__(id)
        self.name = name
        self.questions = questions


class Round(Entity):
    def __init__(self,
                 themes: List[Theme],
                 order: int,
                 id: Optional[int] = None):
        super().__init__(id)
        self.themes = themes
        self.order = order


class Game(Entity):
    def __init__(self,
                 name: str,
                 author: 'User',
                 rounds: List[Round],
                 final_round: Question,
                 id: Optional[int] = None):
        super().__init__(id)
        self.name = name
        self.author = author
        self.rounds = rounds
        self.final_round = final_round
