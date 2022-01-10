from abc import ABC, abstractmethod
from typing import List

from django.contrib.auth import authenticate
from django.contrib.auth.models import User as ORMUser
from rest_framework_simplejwt.tokens import RefreshToken

from backend.dispatcher import dispatch_events
from backend.entities import Entity, User, Session, Game, GameSession
from backend.exceptions import UserNotFound, GameNotFound, GameSessionNotFound
from backend.models import ORMUser, ORMQuestion, ORMTheme, ORMRound, ORMGame, ORMGameSession, ORMPlayer


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


class UserRepo(Repository):
    @staticmethod
    def is_exists(username: str) -> bool:
        return ORMUser.objects.filter(user__username=username).exists()

    @staticmethod
    def get(username: str) -> User:
        try:
            orm_user = ORMUser.objects.get(user__username=username)
        except ORMUser.DoesNotExist:
            raise UserNotFound

        return orm_user.to_domain()

    @staticmethod
    def _create(user: User):
        orm_user = ORMUser.objects.create_user(username=user.username,
                                               password=user.password)
        ORMUser.objects.create(user=orm_user,
                               nickname=user.nickname)

    @staticmethod
    def _update(user: User):
        orm_user = ORMUser.objects.get(user__username=user.username)

        orm_user.nickname = user.nickname
        orm_user.save()

        if user.password:
            orm_user.user.set_password(user.password)

    @staticmethod
    def _delete(user: User):
        raise NotImplementedError

    @staticmethod
    def authenticate(user: User) -> Session:
        orm_user = authenticate(username=user.username,
                                password=user.password)
        if not orm_user:
            raise UserNotFound

        tokens = RefreshToken.for_user(orm_user)
        return Session(refresh=str(tokens),
                       access=str(tokens.access_token))


class GameRepo(Repository):
    @staticmethod
    def is_exists(game_name) -> bool:
        return ORMGame.objects.filter(name=game_name).exists()

    @staticmethod
    def _create(game: Game):
        orm_final_round = ORMQuestion.objects.create(text=game.final_round.text,
                                                     answer=game.final_round.answer,
                                                     value=game.final_round.value)
        orm_user = ORMUser.objects.get(user__username=game.author.username)
        orm_game = ORMGame.objects.create(name=game.name,
                                          author=orm_user,
                                          final_round=orm_final_round)

        for round_index, round in enumerate(game.rounds):
            orm_round = ORMRound.objects.create(order=round_index + 1)

            for theme_index, theme in enumerate(round.themes):
                orm_theme = ORMTheme.objects.create(name=theme.name,
                                                    order=theme_index + 1)

                for question_index, question in enumerate(theme.questions):
                    orm_question = ORMQuestion.objects.create(order=question_index + 1,
                                                              text=question.text,
                                                              answer=question.answer,
                                                              value=question.value)

                    orm_theme.questions.add(orm_question)

                orm_round.themes.add(orm_theme)

            orm_game.rounds.add(orm_round)

    @staticmethod
    def _update(game: Game):
        raise NotImplementedError

    @staticmethod
    def get(game_name) -> Game:
        try:
            orm_game = ORMGame.objects.get(name=game_name)
        except ORMGame.DoesNotExist:
            raise GameNotFound

        return orm_game.to_domain()

    @staticmethod
    def get_all() -> List[Game]:
        return [orm_game.to_domain() for orm_game in ORMGame.objects.all().order_by('name')]

    @staticmethod
    def _delete(game: Game):
        raise NotImplementedError


class GameSessionRepo(Repository):
    @staticmethod
    def is_exists(user: User):
        return ORMGameSession.objects.filter(players__user__user=user.id).exists()

    @staticmethod
    def _create(game_session: GameSession):
        try:
            orm_game = ORMGame.objects.get(name=game_session.game.name)
        except ORMGame.DoesNotExist:
            raise GameNotFound

        orm_user = ORMUser.objects.get(user__username=game_session.creator.username)
        orm_player = ORMPlayer.objects.create(user=orm_user)

        orm_game_session = ORMGameSession.objects.create(creator=orm_user,
                                                         game=orm_game,
                                                         max_players=game_session.max_players)
        orm_game_session.players.add(orm_player)

    @staticmethod
    def get(game_session_id) -> GameSession:
        try:
            orm_game_session = ORMGameSession.objects.get(pk=game_session_id)
        except ORMGameSession.DoesNotExist:
            raise GameSessionNotFound

        return orm_game_session.to_domain()

    @staticmethod
    def get_by_user(user: User) -> GameSession:
        try:
            orm_game_session = ORMGameSession.objects.get(players__user__user=user.id)
        except ORMGameSession.DoesNotExist:
            raise GameSessionNotFound

        return orm_game_session.to_domain()

    @staticmethod
    def get_all() -> List[GameSession]:
        return [orm_gs.to_domain() for orm_gs in ORMGameSession.objects.all().order_by('pk')]

    @staticmethod
    def _update(game_session: GameSession):
        try:
            orm_game_session = ORMGameSession.objects.get(pk=game_session.id)
        except ORMGameSession.DoesNotExist:
            raise GameSessionNotFound

        players_ids = [player.id for player in game_session.players]
        deleted_players_qs = orm_game_session.players.exclude(pk__in=players_ids)
        deleted_players_qs.delete()
        for player in game_session.players:
            orm_player, created = orm_game_session.players \
                .update_or_create(user_id=player.user.id,
                                  defaults=dict(
                                      is_playing=player.is_playing,
                                      score=player.score,
                                      answer=player.answer.text if player.answer else None))
            if created:
                player.id = orm_player.pk

        if game_session.current_round:
            orm_current_round = ORMRound.objects.get(pk=game_session.current_round.id)
            orm_game_session.current_round = orm_current_round
        else:
            orm_game_session.current_round = None

        if game_session.current_question:
            orm_current_question = ORMQuestion.objects.get(pk=game_session.current_question.id)
            orm_game_session.current_question = orm_current_question
        else:
            orm_game_session.current_question = None

        if game_session.current_player:
            orm_current_player = ORMPlayer.objects.get(pk=game_session.current_player.id)
            orm_game_session.current_player = orm_current_player
        else:
            orm_game_session.current_player = None

        orm_game_session.state = game_session.state

        answered_questions_ids = [question.id for question in game_session.answered_questions]
        orm_questions_qs = ORMQuestion.objects.filter(pk__in=answered_questions_ids)
        orm_game_session.answered_questions.set(orm_questions_qs)

        orm_game_session.save()

    @staticmethod
    def _delete(game_session: GameSession):
        try:
            orm_game_session = ORMGameSession.objects.get(pk=game_session.id)
        except ORMGameSession.DoesNotExist:
            raise GameSessionNotFound

        for orm_player in orm_game_session.players.all():
            orm_player.delete()

        orm_game_session.delete()
