from abc import ABC, abstractmethod

from .entities import Entity
from ..infra.dispatcher import dispatch_events


class Repository(ABC):
    @classmethod
    def save(cls, entity: Entity):
        if entity.id:
            cls._update(entity)
        else:
            cls._create(entity)

        dispatch_events(entity)
        entity.clear_events()

    @staticmethod
    @abstractmethod
    def _create(entity: Entity):
        pass

    @staticmethod
    @abstractmethod
    def _update(entity: Entity):
        pass

    @classmethod
    def delete(cls, entity: Entity):
        dispatch_events(entity)
        cls._delete(entity)

    @staticmethod
    @abstractmethod
    def _delete(entity: Entity):
        pass
