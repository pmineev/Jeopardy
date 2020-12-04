import json
from django.http import HttpResponse
from django.contrib.auth.models import User
from backend.models import UserProfile


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
