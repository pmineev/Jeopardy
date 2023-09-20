from django.contrib.auth.models import AnonymousUser

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer

from backend.infra.http.serializers import CreateUserSerializer, LoginUserSerializer, \
    ChangeUserCredentialsSerializer, GameSerializer, CreateGameSessionSerializer, \
    QuestionChoiceSerializer, AnswerRequestSerializer, JoinGameSessionSerializer
from backend.modules.game.exceptions import GameAlreadyExists, GameNotFound
from backend.modules.game.services import GameService
from backend.modules.game_session.dtos import CreateGameSessionDTO, JoinGameSessionDTO, QuestionChoiceDTO, \
    AnswerRequestDTO
from backend.modules.game.dtos import CreateGameDTO
from backend.modules.game_session.exceptions import GameSessionNotFound, TooManyPlayers, NotCurrentPlayer, \
    WrongQuestionRequest, AlreadyPlaying, WrongStage, AlreadyCreated
from backend.modules.game_session.services import GameSessionService
from backend.modules.user.dtos import CreateUserDTO
from backend.modules.user.exceptions import UserAlreadyExists, UserNotFound, UserNicknameAlreadyExists
from backend.modules.user.services import UserService


class UserListView(APIView):
    permission_classes = [AllowAny]

    service = UserService()

    def post(self, request):
        serializer = CreateUserSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            self.service.create(CreateUserDTO(**serializer.validated_data))
            session_dto = self.service.authenticate(serializer.validated_data)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'code': 'invalid_request'})
        except (UserAlreadyExists, UserNicknameAlreadyExists) as e:
            return Response(status=status.HTTP_409_CONFLICT, data={'code': e.code})

        return Response(status=status.HTTP_201_CREATED, data=session_dto.to_response())


class SessionView(ViewSet):
    permission_classes = [AllowAny]

    service = UserService()

    def authenticate(self, request):
        serializer = LoginUserSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            session_dto = self.service.authenticate(serializer.validated_data)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'code': 'invalid_request'})
        except UserNotFound as e:
            return Response(status=status.HTTP_401_UNAUTHORIZED, data={'code': e.code})

        return Response(session_dto.to_response())

    def get_access_token(self, request):
        serializer = TokenRefreshSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'code': 'invalid_request'})
        except TokenError:
            return Response(status=status.HTTP_401_UNAUTHORIZED, data={'code': 'invalid_refresh_token'})

        return Response(serializer.validated_data)


class UserView(APIView):
    service = UserService()

    def get(self, request, username):
        if username != request.user.username:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'code': 'forbidden'})

        try:
            user_dto = self.service.get(username)
        except UserNotFound as e:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'code': e.code})

        return Response(data=user_dto.to_response())

    def patch(self, request, username):
        if username != request.user.username:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'code': 'forbidden'})

        serializer = ChangeUserCredentialsSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            self.service.update(username, serializer.validated_data)
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'code': 'invalid_request'})
        except UserNotFound as e:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'code': e.code})
        except UserNicknameAlreadyExists as e:
            return Response(status=status.HTTP_409_CONFLICT, data={'code': e.code})

        return Response(status=status.HTTP_204_NO_CONTENT)


class GameListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    service = GameService()

    def post(self, request):
        serializer = GameSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            self.service.create(request.user.username,
                                CreateGameDTO(**serializer.validated_data))
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'code': 'invalid_request'})
        except GameAlreadyExists as e:
            return Response(status=status.HTTP_409_CONFLICT, data={'code': e.code})

        return Response(status=status.HTTP_201_CREATED)

    def get(self, request):
        game_description_dtos = self.service.get_all_descriptions()

        return Response(data=[dto.to_response() for dto in game_description_dtos])


class GameSessionListView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    service = GameSessionService()

    def post(self, request):
        serializer = CreateGameSessionSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            game_state_dto = self.service.create(request.user.username,
                                                 CreateGameSessionDTO(**serializer.validated_data))
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'code': 'invalid_request'})
        except GameNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'code': e.code})
        except (AlreadyCreated, AlreadyPlaying) as e:
            return Response(status=status.HTTP_409_CONFLICT, data={'code': e.code})

        return Response(status=status.HTTP_201_CREATED, data=game_state_dto.to_response())

    def get(self, request):
        game_session_description_dtos = self.service.get_all_descriptions(request.user.username
                                                                          if request.user != AnonymousUser else None)

        return Response(data=[dto.to_response() for dto in game_session_description_dtos])


class GameSessionViewSet(ViewSet):
    service = GameSessionService()

    def get_state(self, request):
        try:
            game_state_dto = self.service.get_game_state(request.user.username)
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'code': e.code})

        return Response(data=game_state_dto.to_response())

    def join(self, request):
        serializer = JoinGameSessionSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            game_state_dto = self.service.join(request.user.username,
                                               JoinGameSessionDTO(**serializer.validated_data))
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'code': 'invalid_request'})
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'code': e.code})
        except (TooManyPlayers, AlreadyPlaying) as e:
            return Response(status=status.HTTP_409_CONFLICT, data={'code': e.code})

        return Response(status=status.HTTP_201_CREATED, data=game_state_dto.to_response())

    def leave(self, request):
        try:
            self.service.leave(request.user.username)
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'code': e.code})

        return Response(status=status.HTTP_201_CREATED)

    def start(self, request):
        try:
            self.service.start(request.user.username)
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'code': e.code})
        except WrongStage as e:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'code': e.code})

        return Response(status=status.HTTP_201_CREATED)

    def choose_question(self, request):
        serializer = QuestionChoiceSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            self.service.choose_question(request.user.username,
                                         QuestionChoiceDTO(**serializer.validated_data))
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'code': 'invalid_request'})
        except WrongQuestionRequest as e:
            return Response(status=status.HTTP_422_UNPROCESSABLE_ENTITY, data={'code': e.code})
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'code': e.code})
        except (NotCurrentPlayer, WrongStage) as e:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'code': e.code})

        return Response(status=status.HTTP_201_CREATED)

    def allow_answers(self, request):
        try:
            current_question_answer_dto = self.service.allow_answers(request.user.username)
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'code': e.code})

        return Response(status=status.HTTP_201_CREATED, data=current_question_answer_dto.to_response())

    def submit_answer(self, request):
        serializer = AnswerRequestSerializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            self.service.submit_answer(request.user.username,
                                       AnswerRequestDTO(serializer.validated_data))
        except ValidationError:
            return Response(status=status.HTTP_400_BAD_REQUEST, data={'code': 'invalid_request'})
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'code': e.code})
        except WrongStage as e:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'code': e.code})

        return Response(status=status.HTTP_201_CREATED)

    def confirm_answer(self, request):
        try:
            self.service.confirm_answer(request.user.username)
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'code': e.code})
        except WrongStage as e:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'code': e.code})

        return Response(status=status.HTTP_201_CREATED)

    def reject_answer(self, request):
        try:
            self.service.reject_answer(request.user.username)
        except GameSessionNotFound as e:
            return Response(status=status.HTTP_404_NOT_FOUND, data={'code': e.code})
        except WrongStage as e:
            return Response(status=status.HTTP_403_FORBIDDEN, data={'code': e.code})

        return Response(status=status.HTTP_201_CREATED)
