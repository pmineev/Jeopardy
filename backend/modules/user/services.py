from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .repos import UserRepo

from .dtos import UserDTO, SessionDTO
from .exceptions import UserAlreadyExists, UserNotFound, UserNicknameAlreadyExists
from .entities import User


class UserService:
    def __init__(self, repo: 'UserRepo'):
        self.repo = repo

    def get(self, username: str) -> UserDTO:
        if not self.repo.is_exists(username):
            raise UserNotFound

        user = self.repo.get(username)

        return UserDTO(user)

    def create(self, user_data):
        if self.repo.is_exists(user_data['username']):
            raise UserAlreadyExists

        nickname = user_data.get('nickname') or user_data['username']

        if self.repo.is_nickname_exists(nickname):
            raise UserNicknameAlreadyExists

        user = User(username=user_data['username'],
                    nickname=nickname,
                    password=user_data['password'])

        self.repo.save(user)

    def update(self, user_data, username: str):
        if not self.repo.is_exists(username):
            raise UserNotFound

        user = self.repo.get(username)

        if 'nickname' in user_data:
            if self.repo.is_nickname_exists(user_data['nickname']):
                raise UserNicknameAlreadyExists

            user.nickname = user_data['nickname']

        if 'password' in user_data:
            user.password = user_data['password']

        self.repo.save(user)

    def authenticate(self, user_data) -> SessionDTO:
        user = User(**user_data)

        session = self.repo.authenticate(user)

        return SessionDTO(session)
