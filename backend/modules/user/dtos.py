from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .entities import User, Session

from backend.core.dtos import DTO


class SessionDTO(DTO):
    def __init__(self, session: 'Session'):
        self.access = session.access
        self.refresh = session.refresh
        self.nickname = session.nickname

    def to_response(self):
        return dict(
            access=self.access,
            refresh=self.refresh,
            nickname=self.nickname
        )


class UserDTO(DTO):
    def __init__(self, user: 'User'):
        self.username = user.username
        self.nickname = user.nickname

    def to_response(self):
        return dict(
            username=self.username,
            nickname=self.nickname
        )
