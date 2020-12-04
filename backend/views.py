import json
from django.http import HttpResponse
from django.contrib.auth.models import User
from backend.models import UserProfile
from django.contrib.auth import authenticate, login, logout


def register(request):
    print(request.body)
    if request.method == 'POST':
        body = json.loads(request.body)
        print(body)

        username = body['username']
        nickname = body['nickname'] if 'nickname' in body else username
        password = body['password']

        if username and password:
            if User.objects.filter(username=username).exists():
                return HttpResponse(status=409)
            else:
                user = UserProfile(user=User.objects.create_user(username=username, password=password),
                                   nickname=nickname)
                user.save()
            return HttpResponse(status=201)
        else:
            return HttpResponse(status=401)


def sessions(request):
    print(request.user)
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            print(body)

            username = body['username']
            password = body['password']

            user = authenticate(username=username, password=password)
        except (json.decoder.JSONDecodeError, KeyError):
            return HttpResponse(status=403)

        if user:
            login(request, user)
            return HttpResponse(status=200)
        else:
            return HttpResponse(status=403)

    if request.method == 'DELETE':
        if request.user.is_authenticated:
            logout(request)
            return HttpResponse(status=200)
        else:
            return HttpResponse(status=403)

