import json

from rest_framework import status
from rest_framework.exceptions import ParseError, AuthenticationFailed, PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from backend.exceptions import UserNotFound, UserAlreadyExists, InvalidCredentials, GameAlreadyExists, TooManyPlayers, \
    NotPlayer, NotCurrentPlayer, WrongQuestionRequest, GameNotFound, AlreadyPlaying
from backend.factories import UserFactory, GameFactory, GameSessionFactory
from backend.serializers import SessionSerializer, UserSerializer, GameDescriptionSerializer, \
    GameSessionDescriptionSerializer


class UserListView(APIView):
    permission_classes = [AllowAny]

    interactor = UserFactory.get()

    def post(self, request):
        user_dict = json.loads(request.body)

        if 'username' not in user_dict or 'password' not in user_dict:
            raise ParseError()

        try:
            UserListView.interactor.create(user_dict)
        except UserAlreadyExists:
            return Response(status=status.HTTP_409_CONFLICT)
        except InvalidCredentials:
            raise AuthenticationFailed()

        return Response(status=status.HTTP_201_CREATED)


class SessionView(APIView):
    permission_classes = [AllowAny]

    interactor = UserFactory.get()

    def post(self, request):
        user_dict = json.loads(request.body)

        if 'username' not in user_dict or 'password' not in user_dict:
            raise ParseError()

        try:
            session = SessionView.interactor.create_session(user_dict)
        except (InvalidCredentials, UserNotFound):
            raise AuthenticationFailed()

        session_serializer = SessionSerializer(session)

        return Response(session_serializer.data)


class UserView(APIView):
    interactor = UserFactory.get()

    def get(self, request, username):
        if username != request.user.username:
            raise PermissionDenied()

        user = UserView.interactor.get(username)

        user_serializer = UserSerializer(user)

        return Response(user_serializer.data)

    def patch(self, request, username):
        if username != request.user.username:
            raise PermissionDenied()

        update_dict = json.loads(request.body)

        if 'password' not in update_dict and 'nickname' not in update_dict:
            raise ParseError()

        UserView.interactor.update(update_dict, username)

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

        try:
            GameSessionListView.interactor.create(game_session_dict, request.user.username)
        except GameNotFound:
            raise ParseError()
        except AlreadyPlaying:
            return Response(status=status.HTTP_409_CONFLICT)

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

    def leave(self, request, game_session_id):
        try:
            GameSessionViewSet.interactor.leave(game_session_id, request.user.username)
        except NotPlayer:
            raise PermissionDenied()

        return Response()

    def choose_question(self, request, game_session_id):
        question_dict = json.loads(request.body)

        if 'theme_order' not in question_dict or 'question_order' not in question_dict:
            raise ParseError()

        try:
            GameSessionViewSet.interactor.choose_question(game_session_id, question_dict, request.user.username)
        except (NotPlayer, NotCurrentPlayer):
            raise PermissionDenied()
        except WrongQuestionRequest:
            raise ParseError()

        return Response(status=status.HTTP_201_CREATED)

    def submit_answer(self, request, game_session_id):
        answer_dict = json.loads(request.body)

        if 'answer' not in answer_dict:
            raise ParseError()

        try:
            GameSessionViewSet.interactor.submit_answer(game_session_id, request.user.username, answer_dict['answer'])
        except (NotPlayer, NotCurrentPlayer):
            raise PermissionDenied()

        return Response(status=status.HTTP_201_CREATED)
