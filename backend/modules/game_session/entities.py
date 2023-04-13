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
    FinalRoundStartedEvent, AnswerTimeoutEvent, FinalRoundTimeoutEvent, PlayerInactiveEvent, PlayerActiveEvent


@dataclass
class Answer:
    text: str
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
        self.answer = answer

    @property
    def username(self) -> str:
        return self.user.username

    @property
    def nickname(self) -> str:
        return self.user.nickname


class CurrentQuestion(Entity):
    def __init__(self, question: 'Question', theme_index: int, question_index: int):
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
                 players: Optional[List[Player]] = [],
                 current_player: Optional[Player] = None,
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
            self.players = players
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
            player.is_playing = False
            self.add_event(PlayerInactiveEvent(self, player))

        print(f'{user.username} has left')

    def start_game(self):
        self.current_round = self.game.rounds[0]
        self.current_player = random.choice(self.players)
        self.stage = Stage.ROUND_STARTED

        self.add_event(RoundStartedEvent(self, self.current_round, self.current_player))

        print(f'gs has started, current player - {self.current_player.username}')

    def set_next_round(self):
        self.answered_questions.clear()
        self._clear_players_answers()
        self.current_question = None

        if self.current_round.order < len(self.game.rounds):
            self.current_round = self.game.rounds[self.current_round.order]
            self._set_winner_current_player()
            self.stage = Stage.ROUND_STARTED

            self.add_event(RoundStartedEvent(self, self.current_round, self.current_player))

            print(f'{self.current_round.order} started, winner: {self.current_player.username}')
        else:
            self._set_final_round()

    def _set_final_round(self):
        self.stage = Stage.FINAL_ROUND

        self.current_round = None
        self.current_player = None

        self.add_event(FinalRoundStartedEvent(self))

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

        self.stage = Stage.ANSWERING

        self.add_event(CurrentQuestionChosenEvent(self, self.current_question))

        print(f'{user.username} has chosen question, ti={theme_index} qi={question_index},'
              f' q:{self.current_question.text}, a:{self.current_question.answer}')

    def submit_answer(self, user: 'User', answer_text):
        player = self._get_player(user)

        if self.stage == Stage.ANSWERING:
            value = self.current_question.value

            if self.current_question.answer == answer_text:
                answer = Answer(answer_text, is_correct=True)
                player.answer = answer
                player.score += value

                self.answered_questions.append(self.current_question)

                self.add_event(PlayerCorrectlyAnsweredEvent(self, player))

                if self.is_no_more_questions():
                    self.set_next_round()
                else:
                    self._clear_players_answers()

                    self.current_player = player
                    self.stage = Stage.CHOOSING_QUESTION
            else:
                answer = Answer(answer_text, is_correct=False)
                player.answer = answer
                player.score -= value

                self.add_event(PlayerIncorrectlyAnsweredEvent(self, player))

            print(f'{user.username} has answered {answer_text}:', 'correct' if answer.is_correct else 'wrong')

        elif self.stage == Stage.FINAL_ROUND:
            player.answer = Answer(answer_text)

            print(f'{user.username} final answer: {answer_text}')
        else:
            raise WrongStage

    def answer_timeout(self):
        self.answered_questions.append(self.current_question)

        self.add_event(AnswerTimeoutEvent(self, self.current_question))

        self.current_question = None

        if self.is_no_more_questions():
            self.set_next_round()
        else:
            self._clear_players_answers()

            self.stage = Stage.CHOOSING_QUESTION

    def final_round_timeout(self):
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

    def is_no_more_questions(self) -> bool:
        return len(self.answered_questions) == \
               len(self.current_round.themes) * len(self.current_round.themes[0].questions)

    def check_players_final_answers(self):
        value = self.game.final_round.value
        answer_text = self.game.final_round.answer
        for player in self.players:
            if player.answer:
                if player.answer.text == answer_text:
                    player.score += value
                    player.answer.is_correct = True
                else:
                    player.score -= value
                    player.answer.is_correct = False
            else:
                player.score -= value
                player.answer = Answer('', is_correct=False)

    def _get_player(self, user: 'User') -> Optional[Player]:
        for player in self.players:
            if user == player.user:
                return player

        return None

    def _set_winner_current_player(self):
        winner = max(self.players, key=lambda player: player.score)
        self.current_player = winner

    def _clear_players_answers(self):
        for player in self.players:
            player.answer = None
