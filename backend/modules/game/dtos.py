from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .entities import Game

from ...core.dtos import DTO


class GameDescriptionDTO(DTO):
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
