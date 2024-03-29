"""
ASGI config for jeopardy project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/howto/deployment/asgi/
"""

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from django.urls import re_path

from backend.infra.consumers import LobbyConsumer, GameSessionConsumer

websocket_urlpatterns = [
    re_path(r'^ws/lobby/$', LobbyConsumer.as_asgi()),
    re_path(r'^ws/game_session/$', GameSessionConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter(websocket_urlpatterns),
})
