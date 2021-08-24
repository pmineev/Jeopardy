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
    answer = CharField(required=False)


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
    players = PlayerSerializer(many=True, required=False)


class QuestionDescriptionSerializer(Serializer):
    value = IntegerField()
    text = CharField(required=False)
    is_answered = BooleanField(required=False, default=False)


class ThemeDescriptionSerializer(Serializer):
    name = CharField()
    questions = QuestionDescriptionSerializer(many=True)


class RoundDescriptionSerializer(Serializer):
    order = IntegerField()
    themes = ThemeDescriptionSerializer(many=True)


class GameStateSerializer(Serializer):
    state = CharField()
    players = PlayerSerializer(many=True)
    current_round = RoundDescriptionSerializer(required=False)
    current_player = PlayerSerializer(required=False)
    current_question = QuestionDescriptionSerializer(required=False)
