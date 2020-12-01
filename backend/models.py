from django.db.models import Model, CharField, TextField, IntegerField, ForeignKey, ManyToManyField, CASCADE


class User(Model):
    username = CharField(max_length=50)
    nickname = CharField(max_length=50)
    password = CharField(max_length=50)


class Question(Model):
    order = IntegerField()
    text = TextField()
    answer = TextField()


class Theme(Model):
    questions = ManyToManyField(Question)


class Round(Model):
    themes = ManyToManyField(Theme)


class Game(Model):
    author = ForeignKey(User,
                        related_name='%(class)s_nickname',
                        on_delete=CASCADE)
    rounds = ManyToManyField(Round)
    final_round = ForeignKey(Question, on_delete=CASCADE)


class GameSession(Model):
    creator = ForeignKey(User,
                         related_name='%(class)s_nickname',
                         on_delete=CASCADE)
    game = ForeignKey(Game, on_delete=CASCADE)
    max_players = IntegerField()
    players = ManyToManyField(User)
