from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .entities import User, Session

from backend.core.dtos import ResponseDTO


class SessionDTO(ResponseDTO):
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


class UserDTO(ResponseDTO):
    def __init__(self, user: 'User'):
        self.username = user.username
        self.nickname = user.nickname
        self.is_playing = user.is_playing
        self.is_hosting = user.is_hosting

    def to_response(self):
        return dict(
            username=self.username,
            nickname=self.nickname,
            isPlaying=self.is_playing,
            isHosting=self.is_hosting
        )


@dataclass
class CreateUserDTO:
    username: str
    password: str
    nickname: str | None = None
