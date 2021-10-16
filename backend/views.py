from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from backend.exceptions import UserNotFound, UserAlreadyExists, InvalidCredentials, GameAlreadyExists, TooManyPlayers, \
    NotPlayer, NotCurrentPlayer, WrongQuestionRequest, GameNotFound, AlreadyPlaying, WrongStage
from backend.factories import UserFactory, GameFactory, GameSessionFactory
from backend.serializers import SessionSerializer, UserSerializer, GameDescriptionSerializer, \
    GameSessionDescriptionSerializer, GameStateSerializer, RegisterUserCredentialsSerializer, \
    LoginUserCredentialsSerializer, ChangeUserCredentialsSerializer, GameSerializer, CreateGameSessionSerializer, \
    QuestionChoiceSerializer, PlayerAnswerSerializer


class UserListView(APIView):
    permission_classes = [AllowAny]

    interactor = UserFactory.get()

    def post(self, request):
        serializer = RegisterUserCredentialsSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            UserListView.interactor.create(serializer.validated_data)
            session = UserListView.interactor.create_session(serializer.validated_data)
        except ValidationError:
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except UserAlreadyExists:
            return Response(status=status.HTTP_409_CONFLICT)

        session_serializer = SessionSerializer(session)

        return Response(status=status.HTTP_201_CREATED, data=session_serializer.data)


class SessionView(APIView):
    permission_classes = [AllowAny]

    interactor = UserFactory.get()

    def post(self, request):
        serializer = LoginUserCredentialsSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            session = SessionView.interactor.create_session(serializer.validated_data)
        except ValidationError:
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except (UserNotFound, InvalidCredentials):
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        session_serializer = SessionSerializer(session)

        return Response(session_serializer.data)


class UserView(APIView):
    interactor = UserFactory.get()

    def get(self, request, username):
        if username != request.user.username:
            return Response(status=status.HTTP_403_FORBIDDEN)

        user = UserView.interactor.get(username)

        user_serializer = UserSerializer(user)

        return Response(user_serializer.data)

    def patch(self, request, username):
        if username != request.user.username:
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = ChangeUserCredentialsSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            UserView.interactor.update(serializer.validated_data, username)
        except ValidationError:
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        return Response(status=status.HTTP_204_NO_CONTENT)


class GameListView(APIView):
    interactor = GameFactory.get()

    def post(self, request):
        serializer = GameSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            GameListView.interactor.create(serializer.validated_data, request.user.username)
        except ValidationError:
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except GameAlreadyExists:
            return Response(status=status.HTTP_409_CONFLICT, data=dict(detail='game already exists'))

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
        serializer = CreateGameSessionSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            game_session_description = GameSessionListView.interactor.create(serializer.validated_data,
                                                                             request.user.username)
        except ValidationError:
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except AlreadyPlaying:
            return Response(status=status.HTTP_409_CONFLICT)

        game_session_descriptions_serialized = GameSessionDescriptionSerializer(game_session_description).data

        return Response(status=status.HTTP_201_CREATED, data=game_session_descriptions_serialized)

    def get(self, request):
        game_session_descriptions = GameSessionListView.interactor.get_all_descriptions()

        game_session_descriptions_serialized = list()
        for desc in game_session_descriptions:
            game_session_descriptions_serialized.append(GameSessionDescriptionSerializer(desc).data)

        return Response(game_session_descriptions_serialized)


class GameSessionViewSet(ViewSet):
    interactor = GameSessionFactory.get()

    def id(self, request):
        try:
            game_session_id = GameSessionViewSet.interactor.get_game_session_id(request.user.username)
        except NotPlayer:
            return Response(status=status.HTTP_403_FORBIDDEN)

        return Response(data=dict(id=game_session_id))

    def get_state(self, request, game_session_id):
        try:
            game_state = GameSessionViewSet.interactor.get_game_state(game_session_id)
        except GameNotFound:
            return Response(status=status.HTTP_404_NOT_FOUND)
        except NotPlayer:
            return Response(status=status.HTTP_403_FORBIDDEN)

        game_state_serialized = GameStateSerializer(game_state).data

        return Response(data=game_state_serialized)

    def join(self, request, game_session_id):
        try:
            game_state = GameSessionViewSet.interactor.join(game_session_id, request.user.username)
        except GameNotFound:
            return Response(status=status.HTTP_404_NOT_FOUND)
        except (TooManyPlayers, AlreadyPlaying):
            return Response(status=status.HTTP_409_CONFLICT)

        game_state_serialized = GameStateSerializer(game_state).data

        return Response(status=status.HTTP_201_CREATED, data=game_state_serialized)

    def leave(self, request, game_session_id):
        try:
            GameSessionViewSet.interactor.leave(game_session_id, request.user.username)
        except GameNotFound:
            return Response(status=status.HTTP_404_NOT_FOUND)
        except NotPlayer:
            return Response(status=status.HTTP_403_FORBIDDEN)

        return Response(status=status.HTTP_201_CREATED)

    def choose_question(self, request, game_session_id):
        serializer = QuestionChoiceSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            GameSessionViewSet.interactor.choose_question(game_session_id, serializer.validated_data,
                                                          request.user.username)
        except (ValidationError, WrongQuestionRequest):
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except GameNotFound:
            return Response(status=status.HTTP_404_NOT_FOUND)
        except (NotPlayer, NotCurrentPlayer, WrongStage):
            return Response(status=status.HTTP_403_FORBIDDEN)

        return Response(status=status.HTTP_201_CREATED)

    def submit_answer(self, request, game_session_id):
        serializer = PlayerAnswerSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            GameSessionViewSet.interactor.submit_answer(game_session_id, request.user.username,
                                                        serializer.validated_data)
        except ValidationError:
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except GameNotFound:
            return Response(status=status.HTTP_404_NOT_FOUND)
        except (NotPlayer, WrongStage):
            return Response(status=status.HTTP_403_FORBIDDEN)

        return Response(status=status.HTTP_201_CREATED)
