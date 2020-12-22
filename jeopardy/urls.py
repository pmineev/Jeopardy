"""jeopardy URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, re_path
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import TokenRefreshView

from backend.consumers import LobbyConsumer, GameSessionConsumer
from backend.views import UserListView, UserView, SessionView, GameListView, GameSessionListView, GameSessionViewSet

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', UserListView.as_view()),
    path('users/<str:username>/', UserView.as_view()),
    path('sessions/', SessionView.as_view()),
    path('sessions/new_token/', TokenRefreshView.as_view()),
    path('games/', GameListView.as_view()),
    path('game_sessions/', GameSessionListView.as_view()),
    path('game_sessions/chosen/<int:game_session_id>/', GameSessionViewSet.as_view({'post': 'join'})),
    path('game_sessions/exited/<int:game_session_id>/', GameSessionViewSet.as_view({'delete': 'leave'})),
    path('game_sessions/<int:game_session_id>/question/', GameSessionViewSet.as_view({'post': 'choose_question'})),
    path('game_sessions/<int:game_session_id>/answer/', GameSessionViewSet.as_view({'post': 'submit_answer'})),
    path('swagger/', TemplateView.as_view(
        template_name='swagger.html',
        extra_context={'schema_url': 'openapi-schema'}
    ), name='swagger'),
]

websocket_urlpatterns = [
    re_path(r'^ws/lobby/$', LobbyConsumer.as_asgi()),
    re_path(r'^ws/game_sessions/(?P<game_session_id>\d+)/$', GameSessionConsumer.as_asgi()),
]
