from dataclasses import dataclass
from typing import Optional, List

from backend.core.entities import Entity


class User(Entity):
    def __init__(self,
                 username: str,
                 nickname: Optional[str] = None,
                 password: Optional[str] = None,
                 game_sessions: Optional[List[int]] = None,
                 game_session_id: Optional[int] = None,
                 id: Optional[int] = None):
        super().__init__(id)
        self.username = username
        self.nickname = nickname
        self.password = password
        self.game_sessions = game_sessions
        self.game_session_id = game_session_id

    @property
    def is_playing(self):
        return self.game_session_id is not None


@dataclass
class Session:
    access: str
    refresh: str
    nickname: str
