from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .entities import User

from django.contrib.auth import authenticate
from django.contrib.auth.models import User as ORMDjangoUser
from rest_framework_simplejwt.tokens import RefreshToken

from backend.core.repos import Repository
from backend.infra.models import ORMUser
from backend.modules.user.exceptions import UserNotFound
from backend.modules.user.entities import Session


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
    def _create(user: 'User') -> 'User':
        orm_django_user = ORMDjangoUser.objects.create_user(username=user.username,
                                                            password=user.password)
        orm_user = ORMUser.objects.create(user=orm_django_user,
                                          nickname=user.nickname)

        user.id = orm_user.pk

        return user

    @staticmethod
    def _update(user: 'User') -> 'User':
        orm_user = ORMUser.objects.get(user__username=user.username)

        orm_user.nickname = user.nickname
        orm_user.save()

        if user.password:
            orm_user.user.set_password(user.password)

        return user

    @staticmethod
    def _delete(user: 'User'):
        raise NotImplementedError

    @staticmethod
    def authenticate(user: 'User') -> 'Session':
        orm_django_user = authenticate(username=user.username,
                                       password=user.password)
        if not orm_django_user:
            raise UserNotFound

        orm_user = ORMUser.objects.get(user=orm_django_user)

        tokens = RefreshToken.for_user(orm_django_user)
        return Session(refresh=str(tokens),
                       access=str(tokens.access_token),
                       nickname=orm_user.nickname)


user_repo = UserRepo()
