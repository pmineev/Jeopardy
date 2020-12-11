from backend.entities import Game, GameDescription, UserProfile, Session, GameSession
from backend.models import ORMUserProfile, ORMQuestion, ORMTheme, ORMRound, ORMGame, ORMGameSession
from django.contrib.auth.models import User as ORMUser
from backend.exceptions import UserNotFound, UserAlreadyExists, GameAlreadyExists
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


class UserRepo:
    @staticmethod
    def _to_entity(orm_user_profile):
        user = UserProfile(username=orm_user_profile.username,
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
        print(user, orm_user)
        if not orm_user:
            print('not found')
            raise UserNotFound

        tokens = RefreshToken.for_user(orm_user)
        return Session(refresh_token=str(tokens),
                       access_token=str(tokens.access_token))


class GameRepo:
    @staticmethod
    def create(game: Game):
        if ORMGame.objects.filter(name=game.name).exists():
            raise GameAlreadyExists

        orm_final_round = ORMQuestion.objects.create(text=game.final_round.text,
                                                     answer=game.final_round.answer)
        orm_user = ORMUserProfile.objects.get(user__username=game.author)
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
                                                              answer=question.answer)

                    orm_theme.questions.add(orm_question)

                orm_round.themes.add(orm_theme)

            orm_game.rounds.add(orm_round)

    @staticmethod
    def get_all_descriptions():
        game_descriptions = list()
        for orm_game in ORMGame.objects.all():
            game_description = GameDescription(name=orm_game.name,
                                               author=orm_game.author.nickname,
                                               rounds_count=orm_game.rounds.count()+1)
            game_descriptions.append(game_description)

        return game_descriptions


class GameSessionRepo:
    @staticmethod
    def create(game_session: GameSession):
        orm_user_profile = ORMUserProfile.objects.get(user__username=game_session.creator)

        orm_game = ORMGame.objects.get(name=game_session.game.name)

        orm_game_session = ORMGameSession.objects.create(creator=orm_user_profile,
                                                         game=orm_game,
                                                         max_players=game_session.max_players)
        orm_game_session.players.add(orm_user_profile)
