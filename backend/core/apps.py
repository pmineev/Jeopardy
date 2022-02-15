from django.apps import AppConfig


class BackendConfig(AppConfig):
    name = 'backend'

    def ready(self):
        from backend.modules.game_session.event_handlers import register_handlers
        register_handlers()
