from typing import TYPE_CHECKING, Dict, Type, List, Callable

if TYPE_CHECKING:
    from ..core.entities import Entity
    from ..core.events import Event


class EventDispatcher:
    handlers: Dict[Type['Event'], List[Callable[['Event'], None]]] = {}

    @classmethod
    def register_handler(cls, handler: Callable[['Event'], None], event_type: Type['Event']):
        event_handlers = cls.handlers.get(event_type)
        if event_handlers:
            event_handlers.append(handler)
        else:
            cls.handlers[event_type] = [handler]

    @classmethod
    def dispatch_events(cls, entity: 'Entity'):
        events = entity.get_events()
        for event in events:
            for handler in cls.handlers[type(event)]:
                handler(event)
