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
from django.urls import path

from backend.views import UserListView, UserView, SessionView, GameListView, GameSessionView, GameSessionListView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', UserListView.as_view()),
    path('users/<str:username>/', UserView.as_view()),
    path('sessions/', SessionView.as_view()),
    path('games/', GameListView.as_view()),
    #path('games/<str:game_name>/rounds/<int:round_id>/themes/<int:theme_id>/questions/<int:question_id>', QuestionView.as_view()),
    path('games/<str:game_name>', GameSessionView.as_view()),
    path('lobby/', GameSessionListView.as_view()),
    path('lobby/chosen/<int:game_session_id>/', GameSessionListView.as_view()),
]
