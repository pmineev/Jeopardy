import json

from rest_framework import status
from rest_framework.exceptions import ParseError, AuthenticationFailed, PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from backend.exceptions import UserNotFound, UserAlreadyExists, InvalidCredentials, GameAlreadyExists, TooManyPlayers
from backend.factories import UserFactory, GameFactory, GameSessionFactory
from backend.serializers import SessionSerializer, UserSerializer, GameDescriptionSerializer, \
    GameSessionDescriptionSerializer


class UserListView(APIView):
    permission_classes = [AllowAny]

    interactor = UserFactory.get()

    def post(self, request):
        user_dict = json.loads(request.body)

        if 'username' not in user_dict or 'password' not in user_dict:
            return ParseError()

        try:
            UserListView.interactor.create(user_dict)
        except UserAlreadyExists:
            return Response(status=status.HTTP_409_CONFLICT)
        except InvalidCredentials:
            return AuthenticationFailed()

        return Response(status=status.HTTP_201_CREATED)


class SessionView(APIView):
    permission_classes = [AllowAny]

    interactor = UserFactory.get()

    def post(self, request):
        user_dict = json.loads(request.body)

        if 'username' not in user_dict or 'password' not in user_dict:
            return ParseError()

        try:
            session = SessionView.interactor.create_session(user_dict)
        except (InvalidCredentials, UserNotFound):
            return AuthenticationFailed()

        session_serializer = SessionSerializer(session)

        return Response(session_serializer.data)


class UserView(APIView):
    interactor = UserFactory.get()

    def get(self, request, username):
        if username != request.user.username:
            return PermissionDenied()

        user = UserView.interactor.get(username)

        user_serializer = UserSerializer(user)

        return Response(user_serializer.data)

    def patch(self, request, username):
        if username != request.user.username:
            return PermissionDenied()

        body = json.loads(request.body)

        if 'password' not in body and 'nickname' not in body:
            return ParseError()

        UserView.interactor.update(body)

        return Response()


class GameListView(APIView):
    interactor = GameFactory.get()

    def post(self, request):
        game_dict = json.loads(request.body)

        try:
            GameListView.interactor.create(game_dict, request.user.username)
        except GameAlreadyExists:
            return Response(status=status.HTTP_409_CONFLICT)

        return Response(status=status.HTTP_201_CREATED)

    def get(self, request):
        game_descriptions = GameListView.interactor.get_all_descriptions()

        game_descriptions_serialized = list()
        for desc in game_descriptions:
            game_descriptions_serialized.append(GameDescriptionSerializer(desc).data)

        return Response(game_descriptions_serialized)


class GameSessionListView(APIView):
    interactor = GameSessionFactory.get()

    def post(self, request):
        game_session_dict = json.loads(request.body)

        if 'max_players' not in game_session_dict or 'game_name' not in game_session_dict:
            raise ParseError()

        GameSessionListView.interactor.create(game_session_dict, request.user.username)

        return Response(status=status.HTTP_201_CREATED)

    def get(self, request):
        game_session_descriptions = GameSessionListView.interactor.get_all_descriptions()

        game_session_descriptions_serialized = list()
        for desc in game_session_descriptions:
            game_session_descriptions_serialized.append(GameSessionDescriptionSerializer(desc).data)

        return Response(game_session_descriptions_serialized)


class GameSessionViewSet(ViewSet):
    interactor = GameSessionFactory.get()

    def join(self, request, game_session_id):
        try:
            GameSessionViewSet.interactor.join(game_session_id, request.user.username)
        except TooManyPlayers:
            return Response(status=status.HTTP_409_CONFLICT)

        return Response(status=status.HTTP_201_CREATED)
