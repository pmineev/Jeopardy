import random
from abc import ABC
from dataclasses import dataclass
from typing import Optional, List

from backend.enums import State
from backend.events import PlayerLeftEvent, PlayerJoinedEvent, CurrentPlayerChosenEvent, \
    RoundStartedEvent, FinalRoundStartedEvent, CurrentQuestionChosenEvent, Event, \
    PlayerCorrectlyAnsweredEvent, PlayerIncorrectlyAnsweredEvent, AnswerTimeoutEvent, FinalRoundTimeoutEvent
from backend.exceptions import NotPlayer, WrongQuestionRequest, NotCurrentPlayer, WrongStage, TooManyPlayers


class Entity(ABC):
    def __init__(self, id: Optional[int] = None):
        self.id = id
        self._events: List[Event] = []

    def add_event(self, event):
        self._events.append(event)

    def get_events(self):
        return self._events

    def clear_events(self):
        self._events.clear()

    def __eq__(self, other):
        return self.id == other.id


class User(Entity):
    def __init__(self,
                 username: str,
                 nickname: Optional[str] = None,
                 password: Optional[str] = None,
                 id: Optional[int] = None):
        super().__init__(id)
        self.username = username
        self.nickname = nickname or username
        self.password = password


@dataclass
class Session:
    access: str
    refresh: str


@dataclass
class Answer:
    text: str
    is_correct: Optional[bool] = None


class Player(Entity):
    def __init__(self,
                 user: User,
                 score: int = 0,
                 is_playing: bool = True,
                 answer: Optional[Answer] = None,
                 id: Optional[int] = None):
        super().__init__(id)
        self.user = user
        self.score = score
        self.is_playing = is_playing
        self.answer = answer


class Question(Entity):
    def __init__(self,
                 text: str,
                 answer: str,
                 value: int,
                 theme_index: Optional[int] = None,
                 question_index: Optional[int] = None,
                 id: Optional[int] = None):
        super().__init__(id)
        self.text = text
        self.answer = answer
        self.value = value
        self.theme_index = theme_index
        self.question_index = question_index


class Theme(Entity):
    def __init__(self,
                 name: str,
                 questions: List[Question],
                 id: Optional[int] = None):
        super().__init__(id)
        self.name = name
        self.questions = questions


class Round(Entity):
    def __init__(self,
                 themes: List[Theme],
                 order: int,
                 id: Optional[int] = None):
        super().__init__(id)
        self.themes = themes
        self.order = order


class Game(Entity):
    def __init__(self,
                 name: str,
                 author: User,
                 rounds: List[Round],
                 final_round: Question,
                 id: Optional[int] = None):
        super().__init__(id)
        self.name = name
        self.author = author
        self.rounds = rounds
        self.final_round = final_round


class GameSession(Entity):
    def __init__(self, creator: User,
                 game: Game,
                 max_players: int,
                 state: State = State.WAITING,
                 id: Optional[int] = None,
                 players: Optional[List[Player]] = None,
                 current_player: Optional[Player] = None,
                 current_round: Optional[Round] = None,
                 current_question: Optional[Question] = None,
                 answered_questions: Optional[List[Question]] = None):
        super().__init__(id)
        self.creator = creator
        self.game = game
        self.max_players = max_players
        self.state = state

        if id:
            self.players = players
        else:
            self.players = [Player(creator)]

        self.current_round = current_round
        self.current_player = current_player
        self.current_question = current_question

        self.answered_questions = answered_questions or []

    def join(self, user: User):
        player = self._get_player(user)
        if player:
            if not player.is_playing:
                player.is_playing = True
                self.add_event(PlayerJoinedEvent(self, player))
        else:
            if len(self.players) + 1 > self.max_players:
                raise TooManyPlayers

            player = Player(user)
            self.players.append(player)

            self.add_event(PlayerJoinedEvent(self, player))

        if self.state == State.WAITING and self._is_all_players_joined():
            self.start_game()

        print(f'{user.username} has joined')

    def leave(self, user: User):
        player = self._get_player(user)
        if not player:
            raise NotPlayer

        if self.state == State.WAITING:
            self.players.remove(player)
        else:
            player.is_playing = False

        self.add_event(PlayerLeftEvent(self, player))

        print(f'{user.username} has left')

    def start_game(self):
        self.current_round = self.game.rounds[0]
        self.current_player = random.choice(self.players)
        self.state = State.CHOOSING_QUESTION

        self.add_event(CurrentPlayerChosenEvent(self, self.current_player))  # TODO объединить в одно событие
        self.add_event(RoundStartedEvent(self, self.current_round))

        print(f'gs has started, current player - {self.current_player.user.username}')

    def set_next_round(self):
        self.answered_questions.clear()
        self.current_question = None

        if self.current_round.order < len(self.game.rounds):
            self.current_round = self.game.rounds[self.current_round.order]
            self._set_winner_current_player()
            self.state = State.CHOOSING_QUESTION

            self.add_event(CurrentPlayerChosenEvent(self, self.current_player))
            self.add_event(RoundStartedEvent(self, self.current_round))

            print(f'{self.current_round.order} started, winner: {self.current_player.user.username}')
        else:
            self._set_final_round()

    def _set_final_round(self):
        self.state = State.FINAL_ROUND

        self.current_round = None
        self.current_player = None

        self.add_event(FinalRoundStartedEvent(self))

        print(f'final round started, q:{self.game.final_round.text}, a:{self.game.final_round.answer}')

    def choose_question(self, user: User, theme_index, question_index):
        player = self._get_player(user)
        if not player:
            raise NotPlayer

        if player != self.current_player:
            raise NotCurrentPlayer

        if not self.state == State.CHOOSING_QUESTION:
            raise WrongStage

        try:
            question = self.current_round.themes[theme_index].questions[question_index]
        except IndexError:
            raise WrongQuestionRequest

        if question in self.answered_questions:
            raise WrongQuestionRequest

        self.current_question = question
        self.current_question.theme_index = theme_index
        self.current_question.question_index = question_index

        self.state = State.ANSWERING

        self.add_event(CurrentQuestionChosenEvent(self, self.current_question))

        print(f'{user.username} has chosen question, ti={theme_index} qi={question_index},'
              f' q:{self.current_question.text}, a:{self.current_question.answer}')

    def submit_answer(self, user: User, answer_text):
        player = self._get_player(user)
        if not player:
            raise NotPlayer

        if self.state == State.ANSWERING:
            value = self.current_question.value

            if self.current_question.answer == answer_text:
                answer = Answer(answer_text, is_correct=True)
                player.answer = answer
                player.score += value

                self.answered_questions.append(self.current_question)

                self.add_event(PlayerCorrectlyAnsweredEvent(self, player))

                # TODO очищать ответы игроков, но в player в event ^^^^ должен оставаться старый ответ

                if self.is_no_more_questions():
                    self.set_next_round()
                else:
                    self.current_player = player
                    self.state = State.CHOOSING_QUESTION
            else:
                answer = Answer(answer_text, is_correct=False)
                player.answer = answer
                player.score -= value

                self.add_event(PlayerIncorrectlyAnsweredEvent(self, player))

            print(f'{user.username} has answered {answer_text}:', 'correct' if answer.is_correct else 'wrong')

        elif self.state == State.FINAL_ROUND:
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
            self.state = State.CHOOSING_QUESTION

    def final_round_timeout(self):
        self.check_players_final_answers()
        self.state = State.END_GAME

        self.add_event(FinalRoundTimeoutEvent(self))

    def is_player(self, user: User) -> bool:
        return bool(self._get_player(user))

    def _is_all_players_joined(self) -> bool:
        return self.max_players == len(self.players)

    def is_all_players_left(self) -> bool:
        if self.state == State.WAITING:
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

    def _get_player(self, user: User) -> Optional[Player]:
        for player in self.players:
            if user == player.user:
                return player

        return None

    def _set_winner_current_player(self):
        winner = max(self.players, key=lambda player: player.score)
        self.current_player = winner
