from abc import ABC, abstractmethod


class ResponseDTO(ABC):
    @abstractmethod
    def to_response(self):
        pass
