from backend.entities import UserProfile, Game, Round, Theme, Question, GameSession
from backend.enums import State
from backend.exceptions import InvalidCredentials, NotPlayer, NotCurrentPlayer
from backend.notifiers import GameSessionNotifier


class UserInteractor:
    def __init__(self, repo):
        self.repo = repo

    def get(self, username):
        user = self.repo.get(username)
        return user

    def create(self, user_data):
        if not user_data['username'] or not user_data['password']:
            raise InvalidCredentials

        user = UserProfile(username=user_data['username'],
                           password=user_data['password'])

        if 'nickname' in user_data and user_data['nickname']:
            user.nickname = user_data['nickname']

        self.repo.create(user)

    def update(self, user_data, username):
        user = UserProfile(username=username)

        if 'nickname' in user_data:
            user.nickname = user_data['nickname']

        if 'password' in user_data:
            user.password = user_data['password']

        return self.repo.update(user)

    def create_session(self, user_data):
        if not user_data['username'] or not user_data['password']:
            raise InvalidCredentials

        user = UserProfile(username=user_data['username'],
                           password=user_data['password'])

        return self.repo.create_session(user)


class GameInteractor:
    def __init__(self, repo):
        self.repo = repo

    def create(self, game_data, username):
        final_round_data = game_data['final_round']
        final_round = Question(text=final_round_data['text'],
                               answer=final_round_data['answer'],
                               value=final_round_data['value'])
        game = Game(name=game_data['name'],
                    author=UserProfile(username=username),
                    final_round=final_round,
                    rounds=list())

        for round_order, round_data in enumerate(game_data['rounds']):
            round = Round(order=round_order,
                          themes=list())

            for theme_order, theme_data in enumerate(round_data['themes']):
                theme = Theme(name=theme_data['name'],
                              order=theme_order,
                              questions=list())

                for question_order, question_data in enumerate(theme_data['questions']):
                    question = Question(order=question_order,
                                        text=question_data['text'],
                                        answer=question_data['answer'],
                                        value=question_data['value'])

                    theme.questions.append(question)

                round.themes.append(theme)

            game.rounds.append(round)

        self.repo.create(game)

    def get_all_descriptions(self):
        return self.repo.get_all_descriptions()


class GameSessionInteractor:
    def __init__(self, repo):
        self.repo = repo
        self.notifier = GameSessionNotifier(repo)

    def create(self, game_session_data, username):
        game = Game(name=game_session_data['game_name'])
        game_session = GameSession(creator=username,
                                   game=game,
                                   max_players=game_session_data['max_players'])

        game_session_id = self.repo.create(game_session)

        self.notifier.game_session_created(game_session_id)

    def get_all_descriptions(self):
        return self.repo.get_all_descriptions()

    def join(self, game_session_id, username):
        state = self.repo.get_state(game_session_id)
        if state == State.WAITING:
            self.repo.join(game_session_id, username)

            self.notifier.player_joined(game_session_id)
        elif self.repo.is_player(game_session_id, username):
            self.repo.set_player_state(game_session_id, username, True)

        if self.repo.is_all_players_joined(game_session_id):
            self._start_game(game_session_id)

    def leave(self, game_session_id, username):
        if not self.repo.is_player(game_session_id, username):
            raise NotPlayer

        state = self.repo.get_state(game_session_id)
        if state == State.WAITING:
            self.repo.leave(game_session_id, username)

            self.notifier.player_left(game_session_id)
            print(f'user {username} left')
        else:
            self.repo.set_player_state(game_session_id, username, False)

        if self.repo.is_all_players_left(game_session_id):
            self.repo.delete_game_session(game_session_id)

            self.notifier.game_session_deleted(game_session_id)
            print(f'game deleted')

    def _start_game(self, game_session_id):
        print('game started')
        self._set_next_round(game_session_id)

    def _set_next_round(self, game_session_id):
        self.repo.set_next_round(game_session_id)

        self.notifier.round_started(game_session_id)
        if not self.repo.get_state(game_session_id) == State.FINAL_ROUND:
            self._set_first_player(game_session_id)

            self.notifier.current_player_chosen(game_session_id)

            self.repo.set_state(game_session_id, State.CHOOSING_QUESTION)
        else:
            pass
            # self.notifier.final_round_started(game_session_id)

    def _set_first_player(self, game_session_id):
        state = self.repo.get_state(game_session_id)

        if state == State.WAITING:
            self.repo.set_random_current_player(game_session_id)
        elif state == State.END_ROUND:
            self.repo.set_winner_current_player(game_session_id)

    def choose_question(self, game_session_id, question_data, username):
        if not self.repo.is_player(game_session_id, username):
            raise NotPlayer
        print(f'user {username} is player')

        if not self.repo.is_current_player(game_session_id, username):
            raise NotCurrentPlayer
        print(f'user {username} is current player')

        print(f'state: {self.repo.get_state(game_session_id)}')
        if self.repo.get_state(game_session_id) == State.CHOOSING_QUESTION:
            theme_order = question_data['theme_order']
            question_order = question_data['question_order']
            self.repo.set_current_question(game_session_id, theme_order, question_order)

            self.notifier.current_question_chosen(game_session_id, theme_order, question_order)

            self.repo.set_state(game_session_id, State.ANSWERING)
        else:
            pass

    def submit_answer(self, game_session_id, username, answer):
        if not self.repo.is_player(game_session_id, username):
            raise NotPlayer
        print(f'user {username} is player')
        print(f'{username} answer: {answer}')

        state = self.repo.get_state(game_session_id)
        print(f'state: {state}')
        if state == State.ANSWERING:
            value = self.repo.get_current_question_value(game_session_id)
            if self.repo.is_correct_answer(game_session_id, answer):
                print('correct')
                self.repo.change_player_score(game_session_id, username, value)
                self.repo.mark_current_question_as_answered(game_session_id)

                self.notifier.player_answered(game_session_id, username, answer)

                if self.repo.is_no_more_questions(game_session_id):
                    print('no more questions!')
                    self._set_next_round(game_session_id)
                else:
                    self.repo.set_current_player(game_session_id, username)
                    self.repo.set_state(game_session_id, State.CHOOSING_QUESTION)
            else:
                print('wrong')
                self.repo.change_player_score(game_session_id, username, -value)

                self.notifier.player_answered(game_session_id, username, answer, is_correct=False)

        elif state == State.FINAL_ROUND:
            self.repo.set_player_answer(game_session_id, username, answer)
            if self.repo.is_all_players_answered(game_session_id):
                self.repo.check_players_final_answers(game_session_id)
        else:
            pass
