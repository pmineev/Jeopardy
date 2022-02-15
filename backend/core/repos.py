from abc import ABC, abstractmethod

from backend.core.entities import Entity
from backend.infra.dispatcher import dispatch_events


class Repository(ABC):
    @classmethod
    def save(cls, entity: Entity) -> Entity:
        if entity.id:
            entity = cls._update(entity)
        else:
            entity = cls._create(entity)

        dispatch_events(entity)
        entity.clear_events()

        return entity

    @staticmethod
    @abstractmethod
    def _create(entity: Entity) -> Entity:
        pass

    @staticmethod
    @abstractmethod
    def _update(entity: Entity) -> Entity:
        pass

    @classmethod
    def delete(cls, entity: Entity):
        dispatch_events(entity)
        cls._delete(entity)

    @staticmethod
    @abstractmethod
    def _delete(entity: Entity):
        pass
