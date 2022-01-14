import backend.repos as repos
import backend.services as services

user_repo = repos.UserRepo()
game_repo = repos.GameRepo()
game_session_repo = repos.GameSessionRepo()


class UserFactory:
    service = services.UserService(user_repo)

    @staticmethod
    def get():
        return UserFactory.service


class GameFactory:
    service = services.GameService(game_repo, user_repo)

    @staticmethod
    def get():
        return GameFactory.service


class GameSessionFactory:
    service = services.GameSessionService(game_session_repo, game_repo, user_repo)

    @staticmethod
    def get():
        return GameSessionFactory.service
