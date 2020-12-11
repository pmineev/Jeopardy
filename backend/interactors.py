from backend.entities import UserProfile, Game, Round, Theme, Question, GameSession
from backend.exceptions import InvalidCredentials


class UserInteractor:
    def __init__(self, repo):
        self.repo = repo

    def get(self, username):
        user = self.repo.get(username)
        return user

    def create(self, user_data):
        if not user_data['username'] or not user_data['password']:
            raise InvalidCredentials

        user = UserProfile(username=user_data['username'],
                           password=user_data['password'])

        if 'nickname' in user_data and user_data['nickname']:
            user.nickname = user_data['nickname']

        self.repo.create(user)

    def update(self, user_data):
        user = UserProfile(username=user_data['username'])

        if 'nickname' in user_data:
            user.nickname = user_data['nickname']

        if 'password' in user_data:
            user.password = user_data['password']

        return self.repo.update(user)

    def create_session(self, user_data):
        if not user_data['username'] or not user_data['password']:
            raise InvalidCredentials

        user = UserProfile(username=user_data['username'],
                           password=user_data['password'])

        return self.repo.create_session(user)


class GameInteractor:
    def __init__(self, repo):
        self.repo = repo

    def create(self, game_data, username):
        final_round_data = game_data['final_round']
        final_round = Question(text=final_round_data['text'],
                               answer=final_round_data['answer'])
        game = Game(name=game_data['name'],
                    author=username,
                    final_round=final_round,
                    rounds=list())

        for round_order, round_data in enumerate(game_data['rounds']):
            round = Round(order=round_order,
                          themes=list())

            for theme_order, theme_data in enumerate(round_data['themes']):
                theme = Theme(name=theme_data['name'],
                              order=theme_order,
                              questions=list())

                for question_order, question_data in enumerate(theme_data['questions']):
                    question = Question(order=question_order,
                                        text=question_data['text'],
                                        answer=question_data['answer'])

                    theme.questions.append(question)

                round.themes.append(theme)

            game.rounds.append(round)

        self.repo.create(game)

    def get_all_descriptions(self):
        return self.repo.get_all_descriptions()


class GameSessionInteractor:
    def __init__(self, repo):
        self.repo = repo

    def create(self, game_session_data, game_name, username):
        game = Game(name=game_name)
        game_session = GameSession(creator=username,
                                   game=game,
                                   max_players=game_session_data['max_players'])

        self.repo.create(game_session)
