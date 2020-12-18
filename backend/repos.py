import random

from django.contrib.auth import authenticate
from django.contrib.auth.models import User as ORMUser
from rest_framework_simplejwt.tokens import RefreshToken

from backend.entities import Game, GameDescription, Round, Theme, Question, UserProfile, Session, GameSession, \
    GameSessionDescription, RoundDescription, ThemeDescription, QuestionDescription, Player
from backend.enums import State
from backend.exceptions import UserNotFound, UserAlreadyExists, GameAlreadyExists, TooManyPlayers, WrongQuestionRequest
from backend.models import ORMUserProfile, ORMQuestion, ORMTheme, ORMRound, ORMGame, ORMGameSession, ORMPlayer


class UserRepo:
    @staticmethod
    def _to_entity(orm_user_profile):
        user = UserProfile(username=orm_user_profile.user.username,
                           nickname=orm_user_profile.nickname)
        return user

    @staticmethod
    def get(username):
        orm_user = ORMUser.objects.get(username=username)
        if not orm_user:
            raise UserNotFound

        orm_user_profile = ORMUserProfile.objects.get(user=orm_user)
        return UserRepo._to_entity(orm_user_profile)

    @staticmethod
    def create(user: UserProfile):
        if ORMUser.objects.filter(username=user.username).exists():
            raise UserAlreadyExists

        orm_user = ORMUser.objects.create_user(username=user.username,
                                               password=user.password)
        nickname = user.nickname or user.username
        ORMUserProfile.objects.create(user=orm_user,
                                      nickname=nickname)

    @staticmethod
    def update(user: UserProfile):
        orm_user_profile = ORMUserProfile.objects.get(user__username=user.username)
        if not orm_user_profile:
            raise UserNotFound

        if user.nickname:
            orm_user_profile.nickname = user.nickname
            orm_user_profile.save()

        if user.password:
            orm_user_profile.user.set_password(user.password)

        return UserRepo._to_entity(orm_user_profile)

    @staticmethod
    def create_session(user: UserProfile):
        orm_user = authenticate(username=user.username,
                                password=user.password)
        if not orm_user:
            raise UserNotFound

        tokens = RefreshToken.for_user(orm_user)
        return Session(refresh=str(tokens),
                       access=str(tokens.access_token))


class GameRepo:
    @staticmethod
    def create(game: Game):
        if ORMGame.objects.filter(name=game.name).exists():
            raise GameAlreadyExists

        orm_final_round = ORMQuestion.objects.create(text=game.final_round.text,
                                                     answer=game.final_round.answer,
                                                     value=game.final_round.value)
        orm_user = ORMUserProfile.objects.get(user__username=game.author.username)
        orm_game = ORMGame.objects.create(name=game.name,
                                          author=orm_user,
                                          final_round=orm_final_round)

        for round_order, round in enumerate(game.rounds):
            orm_round = ORMRound.objects.create(order=round_order)

            for theme_order, theme in enumerate(round.themes):
                orm_theme = ORMTheme.objects.create(name=theme.name,
                                                    order=theme_order)

                for question_order, question in enumerate(theme.questions):
                    orm_question = ORMQuestion.objects.create(order=question_order,
                                                              text=question.text,
                                                              answer=question.answer,
                                                              value=question.value)

                    orm_theme.questions.add(orm_question)

                orm_round.themes.add(orm_theme)

            orm_game.rounds.add(orm_round)

    @staticmethod
    def get(game_name):
        orm_game = ORMGame.objects.get(name=game_name)

        orm_final_round = orm_game.final_round
        final_round = Question(text=orm_final_round.text,
                               answer=orm_final_round.answer,
                               value=orm_final_round.value)
        game = Game(name=game_name,
                    author=UserProfile(username=orm_game.author.user.username),
                    final_round=final_round,
                    rounds=list())

        for orm_round in orm_game.rounds.all():
            round = Round(order=orm_round.order,
                          themes=list())

            for orm_theme in orm_round.themes.all():
                theme = Theme(name=orm_theme.name,
                              order=orm_theme.order,
                              questions=list())

                for orm_question in orm_theme.questions.all():
                    question = Question(order=orm_question.order,
                                        text=orm_question.text,
                                        answer=orm_question.answer,
                                        value=orm_question.value)

                    theme.questions.append(question)

                round.themes.append(theme)

            game.rounds.append(round)

        return game

    @staticmethod
    def get_all_descriptions():
        game_descriptions = list()
        for orm_game in ORMGame.objects.all():
            game_description = GameDescription(name=orm_game.name,
                                               author=orm_game.author.nickname,
                                               rounds_count=orm_game.rounds.count() + 1)
            game_descriptions.append(game_description)

        return game_descriptions


class GameSessionRepo:
    @staticmethod
    def create(game_session: GameSession):
        orm_user_profile = ORMUserProfile.objects.get(user__username=game_session.creator)
        orm_player = ORMPlayer.objects.create(user=orm_user_profile)

        orm_game = ORMGame.objects.get(name=game_session.game.name)

        orm_game_session = ORMGameSession.objects.create(creator=orm_user_profile,
                                                         game=orm_game,
                                                         max_players=game_session.max_players)
        orm_game_session.players.add(orm_player)

        return orm_game_session.creator_id

    @staticmethod
    def get_description(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)
        desc = GameSessionDescription(id=orm_game_session.pk,
                                      creator=orm_game_session.creator.nickname,
                                      game_name=orm_game_session.game.name,
                                      max_players=orm_game_session.max_players,
                                      current_players=orm_game_session.players.count())

        return desc

    @staticmethod
    def get_all_descriptions():
        game_session_descriptions = list()
        for orm_game_session in ORMGameSession.objects.all():
            desc = GameSessionDescription(id=orm_game_session.pk,
                                          creator=orm_game_session.creator.nickname,
                                          game_name=orm_game_session.game.name,
                                          max_players=orm_game_session.max_players,
                                          current_players=orm_game_session.players.count())
            game_session_descriptions.append(desc)

        return game_session_descriptions

    @staticmethod
    def join(game_session_id, username):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        if orm_game_session.players.count() + 1 > orm_game_session.max_players:
            raise TooManyPlayers

        orm_user_profile = ORMUserProfile.objects.get(user__username=username)
        orm_player = ORMPlayer.objects.create(user=orm_user_profile)
        orm_game_session.players.add(orm_player)

    @staticmethod
    def leave(game_session_id, username):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)
        orm_player = orm_game_session.players.get(user__user__username=username)
        orm_game_session.players.remove(orm_player)
        orm_player.delete()

    @staticmethod
    def set_player_state(game_session_id, username, state):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)
        orm_player = orm_game_session.players.get(user__user__username=username)
        orm_player.is_playing = state
        orm_player.save()

    @staticmethod
    def is_all_players_left(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        if orm_game_session.state == State.WAITING:
            if not orm_game_session.players.exists():
                return True
        else:
            for orm_player in orm_game_session.players.all():
                if orm_player.is_playing:
                    return False

        return True

    @staticmethod
    def delete_game_session(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)
        for orm_player in orm_game_session.players.all():
            orm_player.delete()
        orm_game_session.delete()

    @staticmethod
    def is_all_players_joined(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        return orm_game_session.max_players == orm_game_session.players.count()

    @staticmethod
    def set_current_player(game_session_id, username):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)
        orm_player = orm_game_session.players.get(user__user__username=username)

        orm_game_session.current_player = orm_player
        orm_game_session.save()

    @staticmethod
    def get_current_player(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)
        orm_player = orm_game_session.current_player

        player = Player(nickname=orm_player.user.nickname,
                        score=orm_player.score,
                        is_playing=orm_player.is_playing)
        return player

    @staticmethod
    def get_player(game_session_id, username):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)
        orm_player = orm_game_session.players.get(user__user__username=username)

        player = Player(nickname=orm_player.user.nickname,
                        score=orm_player.score,
                        is_playing=orm_player.is_playing)
        return player

    @staticmethod
    def set_random_current_player(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        orm_game_session.current_player = random.choice(orm_game_session.players.all())
        print(f'current player: {orm_game_session.current_player.user.user.username}')
        orm_game_session.save()

    @staticmethod
    def set_winner_current_player(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        orm_game_session.current_player = orm_game_session.players.order_by('-score').first()
        print(f'current player: {orm_game_session.current_player.user.user.username}')
        orm_game_session.save()

    @staticmethod
    def set_state(game_session_id, state):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        orm_game_session.state = state
        orm_game_session.save()

    @staticmethod
    def get_state(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        return orm_game_session.state

    @staticmethod
    def is_player(game_session_id, username):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        return orm_game_session.players.filter(user__user__username=username).exists()

    @staticmethod
    def is_current_player(game_session_id, username):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        return username == orm_game_session.current_player.user.user.username

    @staticmethod
    def is_correct_answer(game_session_id, answer):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)
        print(f'question: {orm_game_session.current_question.text}, answer: {orm_game_session.current_question.answer}')

        return answer == orm_game_session.current_question.answer

    @staticmethod
    def get_current_question_value(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        return orm_game_session.current_question.value

    @staticmethod
    def change_player_score(game_session_id, username, value):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        orm_player = orm_game_session.players.get(user__user__username=username)
        orm_player.score += value
        print(f'score: {orm_player.score}')
        orm_player.save()

    @staticmethod
    def mark_current_question_as_answered(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        orm_game_session.answered_questions.add(orm_game_session.current_question)

    @staticmethod
    def is_no_more_questions(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        questions_count = 0
        for orm_theme in orm_game_session.current_round.themes.all():
            questions_count += orm_theme.questions.count()

        return questions_count == orm_game_session.answered_questions.count()

    @staticmethod
    def set_next_round(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        if orm_game_session.state == State.WAITING:
            orm_game_session.current_round = orm_game_session.game.rounds.get(order=0)
        else:
            current_round_order = orm_game_session.current_round.order
            if current_round_order + 1 < orm_game_session.game.rounds.count():
                orm_game_session.current_round = orm_game_session.game.rounds.get(order=current_round_order + 1)
                orm_game_session.answered_questions.clear()
                orm_game_session.state = State.END_ROUND
                print(f'new round order: {orm_game_session.current_round.order}')
            else:
                orm_game_session.state = State.FINAL_ROUND
                print(
                    f'final round, {orm_game_session.game.final_round.text}{orm_game_session.game.final_round.answer}')
        orm_game_session.save()

    @staticmethod
    def set_player_answer(game_session_id, username, answer):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        orm_player = orm_game_session.players.get(user__user__username=username)
        orm_player.answer = answer
        orm_player.save()

    @staticmethod
    def set_current_question(game_session_id, theme_order, question_order):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        orm_theme_qs = orm_game_session.current_round.themes.filter(order=theme_order)
        if not orm_theme_qs.exists():
            raise WrongQuestionRequest
        orm_theme = orm_theme_qs.first()

        orm_question_qs = orm_theme.questions.filter(order=question_order)
        if not orm_question_qs.exists():
            raise WrongQuestionRequest
        orm_question = orm_question_qs.first()

        if orm_game_session.answered_questions.filter(pk=orm_question.pk).exists():
            raise WrongQuestionRequest

        orm_game_session.current_question = orm_question
        print(
            f'current question: {theme_order} {question_order} {orm_game_session.current_question.text}: {orm_game_session.current_question.answer}')
        orm_game_session.save()

    @staticmethod
    def get_current_question(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)
        orm_current_question = orm_game_session.current_question
        question_description = QuestionDescription(value=orm_current_question.value,
                                                   text=orm_current_question.text)

        return question_description

    @staticmethod
    def is_all_players_answered(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        for orm_player in orm_game_session.players.all():
            if not orm_player.answer:
                return False

        return True

    @staticmethod
    def check_players_final_answers(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)

        print(f'all players answered')
        value = orm_game_session.game.final_round.value
        for orm_player in orm_game_session.players.all():
            if orm_player.answer == orm_game_session.game.final_round.answer:
                orm_player.score += value
            else:
                orm_player.score -= value
            orm_player.save()
            print(f'player {orm_player.user.user.username} final score: {orm_player.score}')

    @staticmethod
    def get_current_round_description(game_session_id):
        orm_game_session = ORMGameSession.objects.get(creator_id=game_session_id)
        orm_current_round = orm_game_session.current_round

        round_description = RoundDescription(order=orm_current_round.order,
                                             themes=list())

        for orm_theme in orm_current_round.themes.order_by('order'):
            theme_description = ThemeDescription(name=orm_theme.name,
                                                 questions=list())

            for orm_question in orm_theme.questions.order_by('order'):
                question_description = QuestionDescription(value=orm_question.value)

                theme_description.questions.append(question_description)

            round_description.themes.append(theme_description)

        return round_description
