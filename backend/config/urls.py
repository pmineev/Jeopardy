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

from backend.infra.http.views import UserListView, UserView, SessionView, GameListView, GameSessionListView, \
    GameSessionViewSet

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', UserListView.as_view()),
    path('api/users/<str:username>/', UserView.as_view()),
    path('api/sessions/', SessionView.as_view({'post': 'authenticate'})),
    path('api/sessions/new_token/', SessionView.as_view({'post': 'get_access_token'})),
    path('api/games/', GameListView.as_view()),
    path('api/game_sessions/', GameSessionListView.as_view()),
    path('api/game_sessions/current/', GameSessionViewSet.as_view({'get': 'get_state'})),
    path('api/game_sessions/actions/join/', GameSessionViewSet.as_view({'post': 'join'})),
    path('api/game_sessions/current/actions/leave/', GameSessionViewSet.as_view({'delete': 'leave'})),
    path('api/game_sessions/current/actions/start/', GameSessionViewSet.as_view({'post': 'start'})),
    path('api/game_sessions/current/question/', GameSessionViewSet.as_view({'post': 'choose_question'})),
    path('api/game_sessions/current/actions/allow_answers/', GameSessionViewSet.as_view({'post': 'allow_answers'})),
    path('api/game_sessions/current/answer/', GameSessionViewSet.as_view({'post': 'submit_answer'})),
    path('api/game_sessions/current/actions/confirm_answer/', GameSessionViewSet.as_view({'post': 'confirm_answer'})),
    path('api/game_sessions/current/actions/reject_answer/', GameSessionViewSet.as_view({'post': 'reject_answer'})),
    re_path(r'', TemplateView.as_view(
        template_name='index.html'
    )),
]
