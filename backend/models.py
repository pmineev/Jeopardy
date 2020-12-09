from django.contrib.auth.models import User as ORMUser
from django.db.models import Model, CharField, TextField, IntegerField,\
    ForeignKey, ManyToManyField, OneToOneField, CASCADE, PROTECT


class ORMUserProfile(Model):
    user = OneToOneField(ORMUser,
                         on_delete=CASCADE)
    nickname = CharField(max_length=50)


class ORMQuestion(Model):
    order = IntegerField(null=True)
    text = TextField()
    answer = TextField()


class ORMTheme(Model):
    name = CharField(max_length=50)
    order = IntegerField()
    questions = ManyToManyField(ORMQuestion)


class ORMRound(Model):
    order = IntegerField()
    themes = ManyToManyField(ORMTheme)


class ORMGame(Model):
    name = CharField(max_length=50,
                     primary_key=True)
    author = ForeignKey(ORMUserProfile,
                        on_delete=CASCADE)
    rounds = ManyToManyField(ORMRound)
    final_round = ForeignKey(ORMQuestion, on_delete=CASCADE)


class ORMGameSession(Model):
    creator = OneToOneField(ORMUserProfile,
                            primary_key=True,
                            on_delete=PROTECT)
    game = ForeignKey(ORMGame,
                      on_delete=PROTECT)
    max_players = IntegerField()
    players = ManyToManyField(ORMUserProfile,
                              related_name='players')
