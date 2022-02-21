from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..user.entities import User

from backend.core.repos import Repository
from backend.infra.models import ORMUser, ORMGameSession, ORMGame, ORMPlayer, ORMRound, ORMQuestion
from backend.modules.game.exceptions import GameNotFound
from backend.modules.game_session.exceptions import GameSessionNotFound
from backend.modules.game_session.entities import GameSession


class GameSessionRepo(Repository):
    @staticmethod
    def is_exists(user: 'User'):
        return ORMGameSession.objects.filter(players__user__user=user.id).exists()

    @staticmethod
    def _create(game_session: 'GameSession') -> 'GameSession':
        try:
            orm_game = ORMGame.objects.get(name=game_session.game.name)
        except ORMGame.DoesNotExist:
            raise GameNotFound

        orm_user = ORMUser.objects.get(user__username=game_session.creator.username)

        orm_game_session = ORMGameSession.objects.create(creator=orm_user,
                                                         game=orm_game,
                                                         max_players=game_session.max_players)

        ORMPlayer.objects.create(user=orm_user,
                                 game_session=orm_game_session)

        game_session.id = orm_game_session.pk

        return game_session

    @staticmethod
    def get(game_session_id) -> 'GameSession':
        try:
            orm_game_session = ORMGameSession.objects.get(pk=game_session_id)
        except ORMGameSession.DoesNotExist:
            raise GameSessionNotFound

        return orm_game_session.to_domain()

    @staticmethod
    def get_by_user(user: 'User') -> 'GameSession':
        try:
            orm_game_session = ORMGameSession.objects.get(players__user__user=user.id)
        except ORMGameSession.DoesNotExist:
            raise GameSessionNotFound

        return orm_game_session.to_domain()

    @staticmethod
    def get_by_creator(creator_nickname: str) -> 'GameSession':
        try:
            orm_game_session = ORMGameSession.objects.get(creator__nickname=creator_nickname)
        except ORMGameSession.DoesNotExist:
            raise GameSessionNotFound

        return orm_game_session.to_domain()

    @staticmethod
    def get_all() -> List['GameSession']:
        return [orm_gs.to_domain() for orm_gs in ORMGameSession.objects.all().order_by('pk')]

    @staticmethod
    def _update(game_session: 'GameSession') -> 'GameSession':
        try:
            orm_game_session = ORMGameSession.objects.get(pk=game_session.id)
        except ORMGameSession.DoesNotExist:
            raise GameSessionNotFound

        players_ids = [player.id for player in game_session.players]
        deleted_players_qs = orm_game_session.players.exclude(pk__in=players_ids)
        deleted_players_qs.delete()
        for player in game_session.players:
            orm_player, created = orm_game_session.players \
                .update_or_create(pk=player.user.id,
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

        orm_game_session.stage = game_session.stage

        answered_questions_ids = [question.id for question in game_session.answered_questions]
        orm_questions_qs = ORMQuestion.objects.filter(pk__in=answered_questions_ids)
        orm_game_session.answered_questions.set(orm_questions_qs)

        orm_game_session.save()

        return game_session

    @staticmethod
    def _delete(game_session: 'GameSession'):
        try:
            orm_game_session = ORMGameSession.objects.get(pk=game_session.id)
        except ORMGameSession.DoesNotExist:
            raise GameSessionNotFound

        orm_game_session.delete()


game_session_repo = GameSessionRepo()