from django.contrib.auth.models import User
from django.db.models import Model, CharField, TextField, IntegerField,\
    ForeignKey, ManyToManyField, OneToOneField, CASCADE, PROTECT


class UserProfile(Model):
    user = OneToOneField(User, on_delete=CASCADE)
    nickname = CharField(max_length=50)


class Question(Model):
    order = IntegerField()
    text = TextField()
    answer = TextField()


class Theme(Model):
    name = CharField(max_length=50)
    order = IntegerField()
    questions = ManyToManyField(Question)


class Round(Model):
    order = IntegerField()
    themes = ManyToManyField(Theme)


class Game(Model):
    name = CharField(max_length=50, primary_key=True)
    author = ForeignKey(User,
                        on_delete=CASCADE)
    rounds = ManyToManyField(Round)
    final_round = ForeignKey(Question, on_delete=CASCADE)


class GameSession(Model):
    creator = OneToOneField(User,
                            primary_key=True,
                            on_delete=PROTECT)
    game = ForeignKey(Game, on_delete=CASCADE)
    max_players = IntegerField()
    players = ManyToManyField(User,
                              related_name='players')
