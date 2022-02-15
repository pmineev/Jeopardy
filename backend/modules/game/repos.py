from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from .entities import Game

from backend.core.repos import Repository
from backend.infra.models import ORMUser, ORMGame, ORMQuestion, ORMRound, ORMTheme
from backend.modules.game.exceptions import GameNotFound


class GameRepo(Repository):
    @staticmethod
    def is_exists(game_name) -> bool:
        return ORMGame.objects.filter(name=game_name).exists()

    @staticmethod
    def _create(game: 'Game') -> 'Game':
        orm_final_round = ORMQuestion.objects.create(text=game.final_round.text,
                                                     answer=game.final_round.answer,
                                                     value=game.final_round.value)
        orm_user = ORMUser.objects.get(user__username=game.author.username)
        orm_game = ORMGame.objects.create(name=game.name,
                                          author=orm_user,
                                          final_round=orm_final_round)

        for round_index, round in enumerate(game.rounds):
            orm_round = ORMRound.objects.create(order=round_index + 1)

            for theme_index, theme in enumerate(round.themes):
                orm_theme = ORMTheme.objects.create(name=theme.name,
                                                    order=theme_index + 1)

                for question_index, question in enumerate(theme.questions):
                    orm_question = ORMQuestion.objects.create(order=question_index + 1,
                                                              text=question.text,
                                                              answer=question.answer,
                                                              value=question.value)

                    orm_theme.questions.add(orm_question)

                orm_round.themes.add(orm_theme)

            orm_game.rounds.add(orm_round)

        game.id = orm_game.pk

        return game

    @staticmethod
    def _update(game: 'Game') -> 'Game':
        raise NotImplementedError

    @staticmethod
    def get(game_name) -> 'Game':
        try:
            orm_game = ORMGame.objects.get(name=game_name)
        except ORMGame.DoesNotExist:
            raise GameNotFound

        return orm_game.to_domain()

    @staticmethod
    def get_all() -> List['Game']:
        return [orm_game.to_domain() for orm_game in ORMGame.objects.all().order_by('name')]

    @staticmethod
    def _delete(game: 'Game'):
        raise NotImplementedError
