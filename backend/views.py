from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from backend.exceptions import UserNotFound, UserAlreadyExists, GameAlreadyExists, TooManyPlayers, \
    NotPlayer, NotCurrentPlayer, WrongQuestionRequest, GameNotFound, AlreadyPlaying, WrongStage, GameSessionNotFound
from backend.factories import UserFactory, GameFactory, GameSessionFactory
from backend.serializers import RegisterUserCredentialsSerializer, LoginUserCredentialsSerializer, \
    ChangeUserCredentialsSerializer, GameSerializer, CreateGameSessionSerializer, \
    QuestionChoiceSerializer, AnswerRequestSerializer


class UserListView(APIView):
    permission_classes = [AllowAny]

    interactor = UserFactory.get()

    def post(self, request):
        serializer = RegisterUserCredentialsSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            UserListView.interactor.create(serializer.validated_data)
            session_dto = UserListView.interactor.authenticate(serializer.validated_data)
        except ValidationError:
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except UserAlreadyExists:
            return Response(status=status.HTTP_409_CONFLICT)

        return Response(status=status.HTTP_201_CREATED, data=session_dto.to_response())


class SessionView(APIView):
    permission_classes = [AllowAny]

    interactor = UserFactory.get()

    def post(self, request):
        serializer = LoginUserCredentialsSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            session_dto = SessionView.interactor.authenticate(serializer.validated_data)
        except ValidationError:
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except UserNotFound:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        return Response(session_dto.to_response())


class UserView(APIView):
    interactor = UserFactory.get()

    def get(self, request, username):
        if username != request.user.username:
            return Response(status=status.HTTP_403_FORBIDDEN)

        try:
            user_dto = UserView.interactor.get(username)
        except UserNotFound:
            return Response(status=status.HTTP_403_FORBIDDEN)

        return Response(data=user_dto.to_response())

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
            return Response(status=status.HTTP_409_CONFLICT)

        return Response(status=status.HTTP_201_CREATED)

    def get(self, request):
        game_description_dtos = GameListView.interactor.get_all_descriptions()

        return Response(data=[dto.to_response() for dto in game_description_dtos])


class GameSessionListView(APIView):
    interactor = GameSessionFactory.get()

    def post(self, request):
        serializer = CreateGameSessionSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            game_session_description_dto = GameSessionListView.interactor.create(serializer.validated_data,
                                                                                 request.user.username)
        except GameNotFound:
            return Response(status=status.HTTP_404_NOT_FOUND)
        except ValidationError:
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except AlreadyPlaying:
            return Response(status=status.HTTP_409_CONFLICT)

        return Response(status=status.HTTP_201_CREATED, data=game_session_description_dto.to_response())

    def get(self, request):
        game_session_description_dtos = GameSessionListView.interactor.get_all_descriptions()

        return Response(data=[dto.to_response() for dto in game_session_description_dtos])


class GameSessionViewSet(ViewSet):
    interactor = GameSessionFactory.get()

    def id(self, request):
        try:
            game_session_id_dto = GameSessionViewSet.interactor.get_game_session_id(request.user.username)
        except NotPlayer:
            return Response(status=status.HTTP_403_FORBIDDEN)

        return Response(data=game_session_id_dto.to_response())

    def get_state(self, request, game_session_id):
        try:
            game_state_dto = GameSessionViewSet.interactor.get_game_state(game_session_id, request.user.username)
        except GameNotFound:
            return Response(status=status.HTTP_404_NOT_FOUND)
        except NotPlayer:
            return Response(status=status.HTTP_403_FORBIDDEN)

        return Response(data=game_state_dto.to_response())

    def join(self, request, game_session_id):
        try:
            game_state_dto = GameSessionViewSet.interactor.join(game_session_id, request.user.username)
        except (GameNotFound, GameSessionNotFound):
            return Response(status=status.HTTP_404_NOT_FOUND)
        except (TooManyPlayers, AlreadyPlaying):
            return Response(status=status.HTTP_409_CONFLICT)

        return Response(status=status.HTTP_201_CREATED, data=game_state_dto.to_response())

    def leave(self, request, game_session_id):
        try:
            GameSessionViewSet.interactor.leave(game_session_id, request.user.username)
        except GameSessionNotFound:
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
        serializer = AnswerRequestSerializer(data=request.data)

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
