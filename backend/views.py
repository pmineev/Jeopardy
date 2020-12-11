import json
from django.http import HttpResponse, JsonResponse
from backend.factories import UserFactory, GameFactory, GameSessionFactory
from backend.exceptions import UserNotFound, UserAlreadyExists, InvalidCredentials, GameAlreadyExists
from rest_framework.views import APIView


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
            return HttpResponse(status=409)
        except InvalidCredentials:
            return HttpResponse(status=401)

        return HttpResponse(status=201)


def sessions(request):
    print(request.user)
    if request.method == 'POST':
        user_dict = json.loads(request.body)
        print(user_dict)

        if 'username' not in user_dict or 'password' not in user_dict:
            return HttpResponse(status=400)

        interactor = UserFactory.get()

        try:
            session = interactor.create_session(user_dict)
        except (InvalidCredentials, UserNotFound):
            print('invalid')
            return HttpResponse(status=404)

        return JsonResponse({'access_token': session.access_token,
                             'refresh_token': session.refresh_token})


class UserView(APIView):
    interactor = UserFactory.get()

    def get(self, request, username):
        if username != request.user.username:
            return HttpResponse(status=403)

        user = UserView.interactor.get(username)
        return JsonResponse({'username': user.username,
                             'nickname': user.nickname})

    def patch(self, request, username):
        if username != request.user.username:
            return HttpResponse(status=403)

        body = json.loads(request.body)

        if 'password' not in body and 'nickname' not in body:
            return HttpResponse(status=403)

        UserView.interactor.update(body)

        return HttpResponse(status=200)


def games(request):
    print(request.user, 'games')
    if not request.user.is_authenticated:
        return HttpResponse(status=403)

    interactor = GameFactory.get()

    if request.method == 'POST':
        game_dict = json.loads(request.body)
        try:
            interactor.create(game_dict, request.user.username)
        except GameAlreadyExists:
            return HttpResponse(status=409)

        return HttpResponse(status=201)
    if request.method == 'GET':
        game_descriptions = interactor.get_all_descriptions()

        # не работает, нужен сериализатор
        return JsonResponse(game_descriptions, safe=False)


def start_game(request, game_name):
    print(request.user, 'start_game')
    if not request.user.is_authenticated:
        return HttpResponse(status=403)

    if request.method == 'POST':
        game_session_dict = json.loads(request.body)

        if 'max_players' not in game_session_dict:
            return HttpResponse(status=403)

        interactor = GameSessionFactory.get()
        interactor.create(game_session_dict, game_name, request.user.username)

        return HttpResponse(status=201)
