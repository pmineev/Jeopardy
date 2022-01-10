import backend.interactors as interactors
import backend.repos as repos

user_repo = repos.UserRepo()
game_repo = repos.GameRepo()
game_session_repo = repos.GameSessionRepo()


class UserFactory:
    interactor = interactors.UserInteractor(user_repo)

    @staticmethod
    def get():
        return UserFactory.interactor


class GameFactory:
    interactor = interactors.GameInteractor(game_repo, user_repo)

    @staticmethod
    def get():
        return GameFactory.interactor


class GameSessionFactory:
    interactor = interactors.GameSessionInteractor(game_session_repo, game_repo, user_repo)

    @staticmethod
    def get():
        return GameSessionFactory.interactor
