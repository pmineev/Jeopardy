import backend.modules.game.repos
import backend.modules.game.services
import backend.modules.game_session.repos
import backend.modules.game_session.services
import backend.modules.user.repos
import backend.modules.user.services

user_repo = backend.modules.user.repos.UserRepo()
game_repo = backend.modules.game.repos.GameRepo()
game_session_repo = backend.modules.game_session.repos.GameSessionRepo()


class UserFactory:
    service = backend.modules.user.services.UserService(user_repo)

    @staticmethod
    def get():
        return UserFactory.service


class GameFactory:
    service = backend.modules.game.services.GameService(game_repo, user_repo)

    @staticmethod
    def get():
        return GameFactory.service


class GameSessionFactory:
    service = backend.modules.game_session.services.GameSessionService(game_session_repo, game_repo, user_repo)

    @staticmethod
    def get():
        return GameSessionFactory.service
