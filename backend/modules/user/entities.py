from dataclasses import dataclass
from typing import Optional

from ...core.entities import Entity


class User(Entity):
    def __init__(self,
                 username: str,
                 nickname: Optional[str] = None,
                 password: Optional[str] = None,
                 id: Optional[int] = None):
        super().__init__(id)
        self.username = username
        self.nickname = nickname
        self.password = password


@dataclass
class Session:
    access: str
    refresh: str
    nickname: str
