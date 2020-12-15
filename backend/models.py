from django.contrib.auth.models import User as ORMUser
from django.db.models import Model, CharField, TextField, IntegerField, \
    ForeignKey, ManyToManyField, OneToOneField, CASCADE, PROTECT
from django_enum_choices.fields import EnumChoiceField

from backend.enums import State


class ORMUserProfile(Model):
    user = OneToOneField(ORMUser,
                         primary_key=True,
                         on_delete=CASCADE)
    nickname = CharField(max_length=50)


class ORMPlayer(Model):
    user = OneToOneField(ORMUserProfile,
                         primary_key=True,
                         on_delete=CASCADE)
    score = IntegerField(default=0)
    answer = TextField(null=True)


class ORMQuestion(Model):
    order = IntegerField(null=True)
    text = TextField()
    answer = TextField()
    value = IntegerField()


class ORMTheme(Model):
    name = CharField(max_length=50)
    order = IntegerField()
    questions = ManyToManyField(ORMQuestion,
                                related_name='questions')


class ORMRound(Model):
    order = IntegerField()
    themes = ManyToManyField(ORMTheme)


class ORMGame(Model):
    name = CharField(max_length=50,
                     primary_key=True)
    author = ForeignKey(ORMUserProfile,
                        on_delete=CASCADE)
    rounds = ManyToManyField(ORMRound,
                             related_name='rounds')
    final_round = ForeignKey(ORMQuestion,
                             on_delete=CASCADE)


class ORMGameSession(Model):
    creator = OneToOneField(ORMUserProfile,
                            primary_key=True,
                            on_delete=PROTECT)
    game = ForeignKey(ORMGame,
                      on_delete=PROTECT)
    max_players = IntegerField()
    players = ManyToManyField(ORMPlayer,
                              related_name='players')
    current_round = OneToOneField(ORMRound,
                                  on_delete=PROTECT,
                                  null=True)
    current_question = OneToOneField(ORMQuestion,
                                     on_delete=PROTECT,
                                     null=True)
    current_player = OneToOneField(ORMPlayer,
                                   on_delete=PROTECT,
                                   null=True)
    state = EnumChoiceField(State,
                            default=State.WAITING)
    answered_questions = ManyToManyField(ORMQuestion,
                                         related_name='answered_questions')
