import sys

from django.apps import AppConfig


class BackendConfig(AppConfig):
    name = 'backend'

    def ready(self):
        if 'migrate' in sys.argv or 'makemigrations' in sys.argv or 'collectstatic' in sys.argv:
            return

        from backend.modules.game_session.event_handlers import register_handlers

        from backend.infra.models import ORMPlayer
        from backend.infra.consumers import GameSessionConsumer

        from backend.infra.models import ORMGameSession
        from backend.modules.game_session.services import GameSessionService
        from backend.modules.game_session.enums import Stage
        from backend.infra.timers import Timers, CHOOSING_QUESTION_INTERVAL, FINAL_ROUND_INTERVAL

        register_handlers()

        for orm_player in ORMPlayer.objects.all():
            GameSessionConsumer.add_user(username=orm_player.user.user.username,
                                         game_session_id=orm_player.game_session.pk)

        game_session_service = GameSessionService()
        for orm_game_session in ORMGameSession.objects.all():
            if orm_game_session.host:
                GameSessionConsumer.add_user(username=orm_game_session.host.user.username,
                                             game_session_id=orm_game_session.pk)

            if orm_game_session.stage == Stage.ANSWERING:
                Timers.start(key=orm_game_session.pk,
                             interval=CHOOSING_QUESTION_INTERVAL,
                             callback=game_session_service.answer_timeout,
                             args=(orm_game_session.pk,))
            elif orm_game_session.stage == Stage.FINAL_ROUND:
                Timers.start(key=orm_game_session.pk,
                             interval=FINAL_ROUND_INTERVAL,
                             callback=game_session_service.final_round_timeout,
                             args=(orm_game_session.pk,))
