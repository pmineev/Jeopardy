from abc import ABC
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from .events import Event


class Entity(ABC):
    def __init__(self, id: Optional[int] = None):
        self.id = id
        self._events: List[Event] = []

    def add_event(self, event):
        self._events.append(event)

    def get_events(self):
        return self._events

    def clear_events(self):
        self._events.clear()

    def __eq__(self, other):
        return self.id == other.id
