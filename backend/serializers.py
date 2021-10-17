from django_enum_choices.serializers import EnumChoiceField
from rest_framework.serializers import Serializer, CharField, IntegerField, BooleanField, ListField

from backend.enums import State


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
    roundsCount = IntegerField(source='rounds_count')


class GameSessionDescriptionSerializer(Serializer):  # TODO убрать поля, не нужные для описания сессии
    id = IntegerField()
    creator = CharField()
    gameName = CharField(source='game_name')
    maxPlayers = IntegerField(source='max_players')
    current_players = IntegerField(source='final_round')
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
    state = EnumChoiceField(State)
    players = PlayerSerializer(many=True)
    current_round = RoundDescriptionSerializer(required=False)
    current_player = PlayerSerializer(required=False)
    current_question = QuestionDescriptionSerializer(required=False)


class RegisterUserCredentialsSerializer(Serializer):
    username = CharField()
    nickname = CharField(required=False)
    password = CharField()


class LoginUserCredentialsSerializer(Serializer):
    username = CharField()
    password = CharField()


class ChangeUserCredentialsSerializer(Serializer):
    nickname = CharField(required=False)
    password = CharField(required=False)


class QuestionSerializer(Serializer):
    text = CharField()
    answer = CharField()
    value = IntegerField(min_value=0)


class ThemeSerializer(Serializer):
    name = CharField()
    questions = ListField(child=QuestionSerializer())


class RoundSerializer(Serializer):
    themes = ListField(child=ThemeSerializer())


class GameSerializer(Serializer):
    name = CharField()
    rounds = ListField(child=RoundSerializer())
    finalRound = QuestionSerializer(source='final_round')


class CreateGameSessionSerializer(Serializer):
    gameName = CharField(source='game_name')
    maxPlayers = IntegerField(source='max_players')


class QuestionChoiceSerializer(Serializer):
    themeOrder = IntegerField(min_value=0, source='theme_order')
    questionOrder = IntegerField(min_value=0, source='question_order')


class PlayerAnswerSerializer(Serializer):
    answer = CharField()
