from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..user.entities import User

from ...core.entities import Entity


class Question(Entity):
    def __init__(self,
                 text: str,
                 answer: str,
                 value: int,
                 theme_index: Optional[int] = None,
                 question_index: Optional[int] = None,
                 id: Optional[int] = None):
        super().__init__(id)
        self.text = text
        self.answer = answer
        self.value = value
        self.theme_index = theme_index
        self.question_index = question_index


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
