from django.contrib.auth.models import User as ORMDjangoUser
from django.db.models import Model, CharField, TextField, IntegerField, \
    ForeignKey, ManyToManyField, OneToOneField, BooleanField, CASCADE, PROTECT
from django_enum_choices.fields import EnumChoiceField

from backend.modules.game.entities import Question, Theme, Round, Game
from backend.modules.game_session.entities import Answer, Player, GameSession, CurrentQuestion
from backend.modules.game_session.enums import Stage
from backend.modules.user.entities import User


class ORMUser(Model):
    user = OneToOneField(ORMDjangoUser,
                         primary_key=True,
                         on_delete=CASCADE)
    nickname = CharField(max_length=50,
                         unique=True)

    @property
    def game_session_id(self):
        active_player = self.players.filter(is_playing=True).first()
        return active_player.game_session_id if active_player else None

    def to_domain(self):
        return User(id=self.pk,
                    username=self.user.username,
                    nickname=self.nickname,
                    game_sessions=list(self.players.values_list('game_session_id', flat=True)),
                    game_session_id=self.game_session_id)


class ORMPlayer(Model):
    user = ForeignKey(ORMUser,
                      on_delete=CASCADE,
                      related_name='players')
    game_session = ForeignKey('ORMGameSession',
                              on_delete=CASCADE,
                              related_name='players')
    is_playing = BooleanField(default=True)
    score = IntegerField(default=0)
    answer = TextField(null=True)

    def to_domain(self):
        return Player(id=self.pk,
                      user=self.user.to_domain(),
                      score=self.score,
                      is_playing=self.is_playing,
                      answer=Answer(text=self.answer) if self.answer else None)


class ORMQuestion(Model):
    order = IntegerField(null=True)
    text = TextField()
    answer = TextField()
    value = IntegerField()

    def to_domain(self):
        return Question(id=self.pk,
                        text=self.text,
                        answer=self.answer,
                        value=self.value)


class ORMTheme(Model):
    name = CharField(max_length=50)
    order = IntegerField()
    questions = ManyToManyField(ORMQuestion,
                                related_name='questions')

    def to_domain(self):
        return Theme(id=self.pk,
                     name=self.name,
                     questions=[question.to_domain() for question in self.questions.all()])


class ORMRound(Model):
    order = IntegerField()
    themes = ManyToManyField(ORMTheme)

    def to_domain(self):
        return Round(id=self.pk,
                     order=self.order,
                     themes=[theme.to_domain() for theme in self.themes.all().order_by('order')])


class ORMGame(Model):
    name = CharField(max_length=50,
                     unique=True)
    author = ForeignKey(ORMUser,
                        on_delete=CASCADE)
    rounds = ManyToManyField(ORMRound,
                             related_name='rounds')
    final_round = ForeignKey(ORMQuestion,
                             on_delete=CASCADE)

    def to_domain(self):
        return Game(id=self.pk,
                    name=self.name,
                    author=self.author.to_domain(),
                    rounds=[round.to_domain() for round in self.rounds.all().order_by('order')],
                    final_round=self.final_round.to_domain())


class ORMGameSession(Model):
    creator = OneToOneField(ORMUser,
                            primary_key=True,
                            on_delete=PROTECT)
    game = ForeignKey(ORMGame,
                      on_delete=PROTECT)
    max_players = IntegerField()
    current_round = ForeignKey(ORMRound,
                               on_delete=PROTECT,
                               null=True)
    current_question = ForeignKey(ORMQuestion,
                                  on_delete=PROTECT,
                                  null=True)
    current_player = OneToOneField(ORMPlayer,
                                   on_delete=CASCADE,
                                   null=True)
    stage = EnumChoiceField(Stage,
                            default=Stage.WAITING)
    answered_questions = ManyToManyField(ORMQuestion,
                                         related_name='answered_questions')

    @property
    def current_question_indexes(self):
        question_index = self.current_question.order - 1
        orm_theme = self.current_round.themes.get(questions=self.current_question)
        theme_index = orm_theme.order - 1
        return theme_index, question_index

    def to_domain(self):
        return GameSession(id=self.pk,
                           creator=self.creator.to_domain(),
                           game=self.game.to_domain(),
                           max_players=self.max_players,
                           players=[player.to_domain() for player in self.players.all()],
                           current_round=self.current_round.to_domain() if self.current_round else None,
                           current_question=CurrentQuestion(self.current_question.to_domain(),
                                                            *self.current_question_indexes)
                           if self.current_question else None,
                           current_player=self.current_player.to_domain() if self.current_player else None,
                           stage=self.stage,
                           answered_questions=[question.to_domain() for question in self.answered_questions.all()])
