from django.apps import AppConfig


class BackendConfig(AppConfig):
    name = 'backend'

    def ready(self):
        from backend.modules.game_session.event_handlers import register_handlers

        from backend.infra.models import ORMPlayer
        from backend.infra.consumers import GameSessionConsumer

        register_handlers()

        for orm_player in ORMPlayer.objects.all():
            GameSessionConsumer.add_user(username=orm_player.user.user.username,
                                         game_session_id=orm_player.game_session.pk)
