from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .entities import User

from django.contrib.auth import authenticate
from django.contrib.auth.models import User as ORMDjangoUser
from rest_framework_simplejwt.tokens import RefreshToken

from ...core.repos import Repository
from ...infra.models import ORMUser
from .exceptions import UserNotFound
from .entities import Session


class UserRepo(Repository):
    @staticmethod
    def is_exists(username: str) -> bool:
        return ORMUser.objects.filter(user__username=username).exists()

    @staticmethod
    def is_nickname_exists(nickname: str) -> bool:
        return ORMUser.objects.filter(nickname=nickname).exists()

    @staticmethod
    def get(username: str) -> 'User':
        try:
            orm_user = ORMUser.objects.get(user__username=username)
        except ORMUser.DoesNotExist:
            raise UserNotFound

        return orm_user.to_domain()

    @staticmethod
    def _create(user: 'User'):
        orm_user = ORMDjangoUser.objects.create_user(username=user.username,
                                                     password=user.password)
        ORMUser.objects.create(user=orm_user,
                               nickname=user.nickname)

    @staticmethod
    def _update(user: 'User'):
        orm_user = ORMUser.objects.get(user__username=user.username)

        orm_user.nickname = user.nickname
        orm_user.save()

        if user.password:
            orm_user.user.set_password(user.password)

    @staticmethod
    def _delete(user: 'User'):
        raise NotImplementedError

    @staticmethod
    def authenticate(user: 'User') -> 'Session':
        orm_user = authenticate(username=user.username,
                                password=user.password)
        if not orm_user:
            raise UserNotFound

        tokens = RefreshToken.for_user(orm_user)
        return Session(refresh=str(tokens),
                       access=str(tokens.access_token))
