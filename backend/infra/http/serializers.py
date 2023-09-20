from rest_framework.serializers import Serializer, CharField, IntegerField, ListField, BooleanField


class CreateUserSerializer(Serializer):
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


class JoinGameSessionSerializer(Serializer):
    creator = CharField()


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
    isHost = BooleanField(source='is_host')


class QuestionChoiceSerializer(Serializer):
    themeIndex = IntegerField(min_value=0, source='theme_index')
    questionIndex = IntegerField(min_value=0, source='question_index')


class AnswerRequestSerializer(Serializer):
    answer = CharField(required=False)
