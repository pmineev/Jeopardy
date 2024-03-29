import random
from dataclasses import dataclass
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from ..user.entities import User
    from ..game.entities import Question, Round, Game

from backend.core.entities import Entity
from backend.modules.game_session.enums import Stage
from backend.modules.game_session.exceptions import TooManyPlayers, NotCurrentPlayer, WrongQuestionRequest, WrongStage
from backend.modules.game_session.events import PlayerJoinedEvent, PlayerLeftEvent, RoundStartedEvent, \
    CurrentQuestionChosenEvent, PlayerCorrectlyAnsweredEvent, PlayerIncorrectlyAnsweredEvent, \
    FinalRoundStartedEvent, AnswerTimeoutEvent, FinalRoundTimeoutEvent, PlayerInactiveEvent, PlayerActiveEvent, \
    StartAnswerPeriodEvent, AnswersAllowedEvent, PlayerAnsweringEvent, FinalRoundAnswersAllowedEvent, \
    StopAnswerPeriodEvent, RestartAnswerPeriodEvent, StartFinalRoundPeriodEvent, GameEndedEvent


@dataclass
class Answer:
    text: Optional[str] = None
    is_correct: Optional[bool] = None


class Player(Entity):
    def __init__(self,
                 user: 'User',
                 score: int = 0,
                 is_playing: bool = True,
                 answer: Optional[Answer] = None,
                 id: Optional[int] = None):
        super().__init__(id)
        self.user = user
        self.score = score
        self.is_playing = is_playing
        self.answer = answer or Answer()

    @property
    def username(self) -> str:
        return self.user.username

    @property
    def nickname(self) -> str:
        return self.user.nickname


class CurrentQuestion(Entity):
    def __init__(self,
                 question: 'Question',
                 theme_index: Optional[int] = None,
                 question_index: Optional[int] = None):
        super().__init__(question.id)
        self._question = question
        self.theme_index = theme_index
        self.question_index = question_index

    @property
    def text(self) -> str:
        return self._question.text

    @property
    def answer(self) -> str:
        return self._question.answer

    @property
    def value(self) -> int:
        return self._question.value


class GameSession(Entity):
    def __init__(self, creator: 'User',
                 game: 'Game',
                 max_players: int,
                 stage: Stage = Stage.WAITING,
                 id: Optional[int] = None,
                 host: Optional['User'] = None,
                 players: Optional[List[Player]] = None,
                 current_player: Optional[Player] = None,  # TODO сделать свойством и брать объекты только из players
                 current_round: Optional['Round'] = None,
                 current_question: Optional['CurrentQuestion'] = None,
                 answered_questions: Optional[List['CurrentQuestion']] = None):
        super().__init__(id)
        self.creator = creator
        self.host = host
        self.game = game
        self.max_players = max_players
        self.stage = stage

        if id or host:
            self.players = players or []
        else:
            self.players = [Player(creator)]

        self.current_round = current_round
        self.current_player = current_player
        self.current_question = current_question

        self.answered_questions = answered_questions or []

    @property
    def is_hosted(self):
        return self.host is not None

    def join(self, user: 'User'):
        player = self._get_player(user)
        if player:
            if not player.is_playing:
                player.is_playing = True
                self.add_event(PlayerActiveEvent(self, player))
        else:
            if len(self.players) + 1 > self.max_players:
                raise TooManyPlayers

            player = Player(user)
            self.players.append(player)

            self.add_event(PlayerJoinedEvent(self, player))

        if not self.is_hosted and self.stage == Stage.WAITING and self._is_all_players_joined():
            self.start_game()

        print(f'{user.username} has joined')

    def leave(self, user: 'User'):
        player = self._get_player(user)

        if self.stage == Stage.WAITING:
            self.players.remove(player)
            self.add_event(PlayerLeftEvent(self, player))
        else:
            # TODO неактивный игрок не должен быть текущим
            player.is_playing = False
            self.add_event(PlayerInactiveEvent(self, player))

        print(f'{user.username} has left')

    def start_game(self):
        if self.stage != Stage.WAITING:
            raise WrongStage()

        # TODO нужна проверка на минимум игроков
        self.current_round = self.game.rounds[0]
        self.current_player = random.choice(self.players)  # TODO лучше по алфавиту?
        self.stage = Stage.ROUND_STARTED

        self.add_event(RoundStartedEvent(self, self.current_round, self.current_player))

        print(f'gs has started, current player - {self.current_player.username}')

    def set_next_round(self):
        self.answered_questions.clear()
        self._clear_players_answers()
        self.current_question = None

        if self.current_round.order < len(self.game.rounds):
            self.current_round = self.game.rounds[self.current_round.order]
            self._set_winner_current_player()   # TODO неактивный игрок не должен быть текущим
            self.stage = Stage.ROUND_STARTED

            self.add_event(RoundStartedEvent(self, self.current_round, self.current_player))

            print(f'{self.current_round.order} started, winner: {self.current_player.username}')
        else:
            self._set_final_round()

    def _set_final_round(self):
        self.stage = Stage.FINAL_ROUND

        self.current_round = None
        self.current_player = None
        self.current_question = CurrentQuestion(self.game.final_round)

        self.add_event(FinalRoundStartedEvent(self))
        if not self.is_hosted:
            self.add_event(StartFinalRoundPeriodEvent(self))

        print(f'final round started, q:{self.game.final_round.text}, a:{self.game.final_round.answer}')

    def choose_question(self, user: 'User', theme_index, question_index):
        player = self._get_player(user)

        if self.stage not in [Stage.CHOOSING_QUESTION, Stage.ROUND_STARTED]:
            raise WrongStage

        if player != self.current_player:
            raise NotCurrentPlayer

        try:
            question = self.current_round.themes[theme_index].questions[question_index]
        except IndexError:
            raise WrongQuestionRequest

        if question in self.answered_questions:
            raise WrongQuestionRequest

        self.current_question = CurrentQuestion(question, theme_index, question_index)

        self.add_event(CurrentQuestionChosenEvent(self, self.current_question))

        if self.is_hosted:
            self.stage = Stage.READING_QUESTION
        else:
            self.stage = Stage.ANSWERING
            self.add_event(StartAnswerPeriodEvent(self))

        print(f'{user.username} has chosen question, ti={theme_index} qi={question_index},'
              f' q:{self.current_question.text}, a:{self.current_question.answer}')

    def allow_answers(self):
        if self.stage == Stage.READING_QUESTION:
            self.stage = Stage.ANSWERING
            self.add_event(AnswersAllowedEvent(self))
        elif self.stage == Stage.FINAL_ROUND:
            self.stage = Stage.FINAL_ROUND_ANSWERING
            self.add_event(FinalRoundAnswersAllowedEvent(self))
        else:
            raise WrongStage()

    def submit_answer(self, user: 'User', answer_text):
        player = self._get_player(user)

        if self.stage == Stage.ANSWERING:
            if self.is_hosted:
                self.stage = Stage.PLAYER_ANSWERING
                self.current_player = player
                print('submit', str([p is self.current_player for p in [*self.players, player]]))
                
                self.add_event(PlayerAnsweringEvent(self, player))

                print(f'{user.username} is answering')
            elif self.current_question.answer == answer_text:
                answer = Answer(answer_text, is_correct=True)
                player.answer = answer
                player.score += self.current_question.value

                self.answered_questions.append(self.current_question)

                self.add_event(PlayerCorrectlyAnsweredEvent(self, player))
                self.add_event(StopAnswerPeriodEvent(self))

                print(f'{user.username} has answered {answer_text}: correct')

                if self._is_no_more_questions():
                    self.set_next_round()
                else:
                    self._clear_players_answers()

                    self.current_player = player
                    self.stage = Stage.CHOOSING_QUESTION
            else:
                answer = Answer(answer_text, is_correct=False)
                player.answer = answer
                player.score -= self.current_question.value

                self.add_event(PlayerIncorrectlyAnsweredEvent(self, player))
                self.add_event(RestartAnswerPeriodEvent(self))

                print(f'{user.username} has answered {answer_text}: wrong')

        elif self.stage in [Stage.FINAL_ROUND, Stage.FINAL_ROUND_ANSWERING]:
            player.answer = Answer(answer_text)

            print(f'{user.username} final answer: {answer_text}')
        else:
            raise WrongStage

    def confirm_answer(self):
        player = self._get_player(self.current_player.user)
        self.current_player = player

        if self.stage == Stage.PLAYER_ANSWERING:
            self.current_player.answer = Answer(is_correct=True)
            self.current_player.score += self.current_question.value

            self.answered_questions.append(self.current_question)

            self.add_event(PlayerCorrectlyAnsweredEvent(self, self.current_player))
            self.add_event(StopAnswerPeriodEvent(self))

            if self._is_no_more_questions():
                self.set_next_round()
            else:
                self.stage = Stage.CHOOSING_QUESTION
        elif self.stage == Stage.FINAL_ROUND_ENDED:
            self.current_player.answer.is_correct = True
            self.current_player.score += self.game.final_round.value

            self.add_event(PlayerCorrectlyAnsweredEvent(self, self.current_player))

            if self._is_all_answers_checked():
                self.stage = Stage.END_GAME
                self.add_event(GameEndedEvent(self))
            else:
                self._set_next_answering_player()
        else:
            raise WrongStage()

    def reject_answer(self):
        player = self._get_player(self.current_player.user)
        self.current_player = player

        if self.stage == Stage.PLAYER_ANSWERING:
            self.current_player.answer = Answer(is_correct=False)
            self.current_player.score -= self.current_question.value
            self.stage = Stage.ANSWERING

            self.add_event(PlayerIncorrectlyAnsweredEvent(self, self.current_player))
            self.add_event(RestartAnswerPeriodEvent(self))
        elif self.stage == Stage.FINAL_ROUND_ENDED:
            self.current_player.answer.is_correct = False
            self.current_player.score -= self.game.final_round.value

            self.add_event(PlayerIncorrectlyAnsweredEvent(self, self.current_player))

            if self._is_all_answers_checked():
                self.stage = Stage.END_GAME
                self.add_event(GameEndedEvent(self))
            else:
                self._set_next_answering_player()
        else:
            raise WrongStage()

    def answer_timeout(self):
        self.answered_questions.append(self.current_question)

        self.add_event(AnswerTimeoutEvent(self, self.current_question))

        self.current_question = None

        if self._is_no_more_questions():
            self.set_next_round()
        else:
            self._clear_players_answers()

            self.stage = Stage.CHOOSING_QUESTION

    def final_round_timeout(self):
        if self.is_hosted:
            self.stage = Stage.FINAL_ROUND_ENDED

            self._set_next_answering_player()
            self.add_event(PlayerAnsweringEvent(self, self.current_player))
        else:
            self.check_players_final_answers()
            self.stage = Stage.END_GAME

        self.add_event(FinalRoundTimeoutEvent(self))

    def is_player(self, user: 'User') -> bool:
        return bool(self._get_player(user))

    def _is_all_players_joined(self) -> bool:
        return self.max_players == len(self.players)

    def is_all_players_left(self) -> bool:
        if self.stage == Stage.WAITING:
            return len(self.players) == 0
        else:
            return not any(player.is_playing for player in self.players)

    def check_players_final_answers(self):
        value = self.game.final_round.value
        answer_text = self.game.final_round.answer
        for player in self.players:
            if player.answer.text == answer_text:
                player.score += value
                player.answer.is_correct = True
            else:
                player.score -= value
                player.answer.is_correct = False

    def _get_player(self, user: 'User') -> Optional[Player]:
        for player in self.players:
            if user == player.user:
                return player

        return None

    def _set_winner_current_player(self):
        winner = max(self.players, key=lambda player: player.score)
        self.current_player = winner

    def _set_next_answering_player(self):
        not_checked_players = filter(lambda p: p.answer.is_correct is None, self.players)
        if not_checked_players:
            self.current_player = max(not_checked_players, key=lambda p: p.score)
        else:
            self.current_player = None
        print(self.current_player.nickname if self.current_player else None)

    def _is_no_more_questions(self) -> bool:
        return len(self.answered_questions) == \
               len(self.current_round.themes) * len(self.current_round.themes[0].questions)

    def _is_all_answers_checked(self):
        return all(player.answer.is_correct is not None for player in self.players)

    def _clear_players_answers(self):
        for player in self.players:
            player.answer.text = None
            player.answer.is_correct = None
