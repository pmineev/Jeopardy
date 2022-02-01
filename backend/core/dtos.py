from abc import ABC, abstractmethod


class DTO(ABC):
    @abstractmethod
    def to_response(self):
        pass
