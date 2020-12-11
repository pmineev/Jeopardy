from rest_framework.serializers import Serializer, CharField, IntegerField


class SessionSerializer(Serializer):
    access_token = CharField()
    refresh_token = CharField()


class UserSerializer(Serializer):
    username = CharField()
    nickname = CharField()


class GameDescriptionSerializer(Serializer):
    name = CharField()
    author = CharField()
    rounds_count = IntegerField()


class GameSessionDescriptionSerializer(Serializer):
    id = IntegerField()
    creator = CharField()
    game_name = CharField()
    max_players = IntegerField()
    current_players = IntegerField()
