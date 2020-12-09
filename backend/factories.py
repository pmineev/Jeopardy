from backend.interactors import UserInteractor, GameInteractor, GameSessionInteractor
from backend.repos import UserRepo, GameRepo, GameSessionRepo


class UserFactory:
    @staticmethod
    def get():
        return UserInteractor(UserRepo)


class GameFactory:
    @staticmethod
    def get():
        return GameInteractor(GameRepo)


class GameSessionFactory:
    @staticmethod
    def get():
        return GameSessionInteractor(GameSessionRepo)
