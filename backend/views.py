import json
from django.http import JsonResponse
from backend.factories import UserFactory, GameFactory, GameSessionFactory
from backend.exceptions import UserNotFound, UserAlreadyExists, InvalidCredentials, GameAlreadyExists
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ParseError, AuthenticationFailed, PermissionDenied


def register(request):
    print(request.body)
    if request.method == 'POST':
        user_dict = json.loads(request.body)
        print(user_dict)

        if 'username' not in user_dict or 'password' not in user_dict:
            return HttpResponse(status=400)

        interactor = UserFactory.get()

        try:
            interactor.create(user_dict)
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
        print(user_dict)

        if 'username' not in user_dict or 'password' not in user_dict:
            return ParseError()

        try:
            session = SessionView.interactor.create_session(user_dict)
        except (InvalidCredentials, UserNotFound):
            print('invalid')
            return AuthenticationFailed()

        return JsonResponse({'access_token': session.access_token,
                             'refresh_token': session.refresh_token})


class UserView(APIView):
    interactor = UserFactory.get()

    def get(self, request, username):
        if username != request.user.username:
            return PermissionDenied()

        user = UserView.interactor.get(username)
        return JsonResponse({'username': user.username,
                             'nickname': user.nickname})

    def patch(self, request, username):
        if username != request.user.username:
            return PermissionDenied()

        body = json.loads(request.body)

        if 'password' not in body and 'nickname' not in body:
            return ParseError()

        UserView.interactor.update(body)

        return Response()


class GameView(APIView):
    interactor = GameFactory.get()

    def post(self, request):
        print(request.user, 'games')
        game_dict = json.loads(request.body)

        try:
            GameView.interactor.create(game_dict, request.user.username)
        except GameAlreadyExists:
            return Response(status=status.HTTP_409_CONFLICT)

        return Response(status=status.HTTP_201_CREATED)

    def get(self, request):
        game_descriptions = GameView.interactor.get_all_descriptions()

        # не работает, нужен сериализатор
        return JsonResponse(game_descriptions, safe=False)


class GameSessionView(APIView):
    interactor = GameSessionFactory.get()

    def post(self, request, game_name):
        print(request.user, 'start_game')
        game_session_dict = json.loads(request.body)

        if 'max_players' not in game_session_dict:
            return ParseError()

        GameSessionView.interactor.create(game_session_dict, game_name, request.user.username)

        return Response(status=status.HTTP_201_CREATED)
