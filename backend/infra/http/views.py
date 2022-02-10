from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from .serializers import RegisterUserCredentialsSerializer, LoginUserCredentialsSerializer, \
    ChangeUserCredentialsSerializer, GameSerializer, CreateGameSessionSerializer, \
    QuestionChoiceSerializer, AnswerRequestSerializer, CreatorNicknameSerializer
from ..factories import UserFactory, GameFactory, GameSessionFactory
from ...modules.game.exceptions import GameAlreadyExists, GameNotFound
from ...modules.game_session.exceptions import GameSessionNotFound, TooManyPlayers, NotCurrentPlayer, \
    WrongQuestionRequest, AlreadyPlaying, WrongStage
from ...modules.user.exceptions import UserAlreadyExists, UserNotFound, UserNicknameAlreadyExists


class UserListView(APIView):
    permission_classes = [AllowAny]

    service = UserFactory.get()

    def post(self, request):
        serializer = RegisterUserCredentialsSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            UserListView.service.create(serializer.validated_data)
            session_dto = UserListView.service.authenticate(serializer.validated_data)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'error': 'invalid_request'})
        except (UserAlreadyExists, UserNicknameAlreadyExists) as e:
            return Response(status=status.HTTP_409_CONFLICT, data={'error': e.error})

        return Response(status=status.HTTP_201_CREATED, data=session_dto.to_response())


class SessionView(APIView):
    permission_classes = [AllowAny]

    service = UserFactory.get()

    def post(self, request):
        serializer = LoginUserCredentialsSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            session_dto = SessionView.service.authenticate(serializer.validated_data)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'error': 'invalid_request'})
        except UserNotFound as e:
            return Response(status=status.HTTP_401_UNAUTHORIZED, data={'error': e.error})

        return Response(session_dto.to_response())


class UserView(APIView):
    service = UserFactory.get()

    def get(self, request, username):
        if username != request.user.username:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'error': 'forbidden'})

        try:
            user_dto = UserView.service.get(username)
        except UserNotFound as e:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'error': e.error})

        return Response(data=user_dto.to_response())

    def patch(self, request, username):
        if username != request.user.username:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'error': 'forbidden'})

        serializer = ChangeUserCredentialsSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            UserView.service.update(serializer.validated_data, username)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'error': 'invalid_request'})
        except UserNotFound as e:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'error': e.error})
        except UserNicknameAlreadyExists as e:
            return Response(status=status.HTTP_409_CONFLICT, data={'error': e.error})

        return Response(status=status.HTTP_204_NO_CONTENT)


class GameListView(APIView):
    service = GameFactory.get()

    def post(self, request):
        serializer = GameSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            GameListView.service.create(serializer.validated_data, request.user.username)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'error': 'invalid_request'})
        except GameAlreadyExists as e:
            return Response(status=status.HTTP_409_CONFLICT, data={'error': e.error})

        return Response(status=status.HTTP_201_CREATED)

    def get(self, request):
        game_description_dtos = GameListView.service.get_all_descriptions()

        return Response(data=[dto.to_response() for dto in game_description_dtos])


class GameSessionListView(APIView):
    interactor = GameSessionFactory.get()

    def post(self, request):
        serializer = CreateGameSessionSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            GameSessionListView.interactor.create(serializer.validated_data,
                                                  request.user.username)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'error': 'invalid_request'})
        except GameNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'error': e.error})
        except AlreadyPlaying as e:
            return Response(status=status.HTTP_409_CONFLICT, data={'error': e.error})

        return Response(status=status.HTTP_201_CREATED)

    def get(self, request):
        game_session_description_dtos = GameSessionListView.interactor.get_all_descriptions()

        return Response(data=[dto.to_response() for dto in game_session_description_dtos])


class GameSessionViewSet(ViewSet):
    service = GameSessionFactory.get()

    def get_state(self, request):
        try:
            game_state_dto = GameSessionViewSet.service.get_game_state(request.user.username)
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'error': e.error})

        return Response(data=game_state_dto.to_response())

    def join(self, request):
        serializer = CreatorNicknameSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            GameSessionViewSet.service.join(request.user.username, serializer.validated_data)

        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'error': 'invalid_request'})
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'error': e.error})
        except (TooManyPlayers, AlreadyPlaying) as e:
            return Response(status=status.HTTP_409_CONFLICT, data={'error': e.error})

        return Response(status=status.HTTP_201_CREATED)

    def leave(self, request):
        try:
            GameSessionViewSet.service.leave(request.user.username)
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'error': e.error})

        return Response(status=status.HTTP_201_CREATED)

    def choose_question(self, request):
        serializer = QuestionChoiceSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            GameSessionViewSet.service.choose_question(request.user.username, serializer.validated_data)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'error': 'invalid_request'})
        except WrongQuestionRequest as e:
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY, data={'error': e.error})
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'error': e.error})
        except (NotCurrentPlayer, WrongStage) as e:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'error': e.error})

        return Response(status=status.HTTP_201_CREATED)

    def submit_answer(self, request):
        serializer = AnswerRequestSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            GameSessionViewSet.service.submit_answer(request.user.username, serializer.validated_data)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'error': 'invalid_request'})
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'error': e.error})
        except WrongStage as e:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'error': e.error})

        return Response(status=status.HTTP_201_CREATED)
