from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.modules.user.dtos import CreateUserDTO

from backend.modules.user.dtos import UserDTO, SessionDTO
from backend.modules.user.entities import User
from backend.modules.user.exceptions import UserAlreadyExists, UserNotFound, UserNicknameAlreadyExists
from backend.modules.user.repos import user_repo


class UserService:
    repo = user_repo

    def get(self, username: str) -> UserDTO:
        if not self.repo.is_exists(username):
            raise UserNotFound

        user = self.repo.get(username)

        return UserDTO(user)

    def create(self, user_data: 'CreateUserDTO'):
        if self.repo.is_exists(user_data.username):
            raise UserAlreadyExists

        nickname = user_data.nickname or user_data.username

        if self.repo.is_nickname_exists(nickname):
            raise UserNicknameAlreadyExists

        # TODO добавить проверку на длину пароля (надо от 6 символов)
        user = User(username=user_data.username,
                    nickname=nickname,
                    password=user_data.password)

        self.repo.save(user)

    def update(self, username: str, user_data):
        if not self.repo.is_exists(username):
            raise UserNotFound

        user = self.repo.get(username)

        if 'nickname' in user_data:
            if self.repo.is_nickname_exists(user_data['nickname']):
                raise UserNicknameAlreadyExists

            user.nickname = user_data['nickname']

        # TODO добавить проверку на длину пароля (надо от 6 символов)
        if 'password' in user_data:
            user.password = user_data['password']

        self.repo.save(user)

    def authenticate(self, user_data) -> SessionDTO:
        user = User(**user_data)

        session = self.repo.authenticate(user)

        return SessionDTO(session)
