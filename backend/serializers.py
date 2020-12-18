from rest_framework.serializers import Serializer, CharField, IntegerField, BooleanField


class SessionSerializer(Serializer):
    access = CharField()
    refresh = CharField()


class UserSerializer(Serializer):
    username = CharField()
    nickname = CharField()


class PlayerSerializer(Serializer):
    nickname = CharField()
    score = IntegerField()
    is_playing = BooleanField(default=True)


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


class QuestionDescriptionSerializer(Serializer):
    value = IntegerField()


class ThemeDescriptionSerializer(Serializer):
    name = CharField()
    questions = QuestionDescriptionSerializer(many=True)


class RoundDescriptionSerializer(Serializer):
    order = IntegerField()
    themes = ThemeDescriptionSerializer(many=True)
