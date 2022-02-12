from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..user.repos import UserRepo
    from ..game.repos import GameRepo

from ..user.exceptions import UserNotFound
from .exceptions import GameAlreadyExists
from .dtos import GameDescriptionDTO
from .entities import Question, Theme, Round, Game


class GameService:
    def __init__(self, repo: 'GameRepo', user_repo: 'UserRepo'):
        self.repo = repo
        self.user_repo = user_repo

    def create(self, game_data, username: str):
        if not self.user_repo.is_exists(username):
            raise UserNotFound

        user = self.user_repo.get(username)

        if self.repo.is_exists(game_data['name']):
            raise GameAlreadyExists

        rounds = list()

        for round_index, round_data in enumerate(game_data['rounds']):  # TODO выделить создание сущностей
            themes = list()

            for theme_data in round_data['themes']:
                questions = list()

                for question_data in theme_data['questions']:
                    questions.append(Question(text=question_data['text'],
                                              answer=question_data['answer'],
                                              value=question_data['value']))

                themes.append(Theme(name=theme_data['name'],
                                    questions=questions))

            rounds.append(Round(order=round_index + 1,
                                themes=themes))

        final_round_data = game_data['final_round']
        final_round = Question(text=final_round_data['text'],
                               answer=final_round_data['answer'],
                               value=final_round_data['value'])

        game = Game(name=game_data['name'],
                    author=user,
                    rounds=rounds,
                    final_round=final_round)

        self.repo.save(game)

    def get_all_descriptions(self) -> List[GameDescriptionDTO]:
        games = self.repo.get_all()

        return [GameDescriptionDTO(game) for game in games]
