from typing import List, Union, TYPE_CHECKING

if TYPE_CHECKING:
    from ..game.entities import Round, Theme, Question
    from ..game_session.entities import CurrentQuestion
    from .entities import GameSession, Player, Answer

from ...core.dtos import DTO
from .enums import Stage


class CorrectAnswerDTO(DTO):
    def __init__(self, question: Union['Question', 'CurrentQuestion']):
        self.answer = question.answer

    def to_response(self):
        return dict(
            answer=self.answer
        )


class AnswerDTO(DTO):
    def __init__(self, answer: 'Answer'):
        self.text = answer.text
        self.is_correct = answer.is_correct

    def to_response(self):
        return dict(
            text=self.text,
            isCorrect=self.is_correct
        )


class PlayerDTO(DTO):
    def __init__(self, player: 'Player'):
        self.nickname = player.nickname
        self.score = player.score
        self.is_playing = player.is_playing
        self.answer = AnswerDTO(player.answer) if player.answer else None

    def to_response(self):
        response = dict(
            nickname=self.nickname,
            score=self.score,
            isPlaying=self.is_playing
        )
        if self.answer:
            response |= dict(answer=self.answer.to_response())

        return response


class FinalRoundQuestionDTO(DTO):
    def __init__(self, question: 'Question', with_answer=False):
        self.text = question.text
        self.value = question.value
        self.answer = CorrectAnswerDTO(question) if with_answer else None

    def to_response(self):
        response = dict(
            text=self.text,
            value=self.value
        )
        if self.answer:
            response |= self.answer.to_response()

        return response


class CurrentQuestionDTO(DTO):
    def __init__(self, question: 'CurrentQuestion'):
        self.text = question.text
        self.theme_index = question.theme_index
        self.question_index = question.question_index

    def to_response(self):
        return dict(
            text=self.text,
            themeIndex=self.theme_index,
            questionIndex=self.question_index
        )


class QuestionDTO(DTO):
    def __init__(self, question: 'Question', is_answered: bool):
        self.value = question.value
        self.is_answered = is_answered

    def to_response(self):
        return dict(
            value=self.value,
            isAnswered=self.is_answered
        )


class ThemeDTO(DTO):
    def __init__(self, theme: 'Theme', answered_questions: List['Question']):
        self.name = theme.name
        self.questions = [QuestionDTO(question, question in answered_questions) for question in theme.questions]

    def to_response(self):
        return dict(
            name=self.name,
            questions=[question.to_response() for question in self.questions]
        )


class CurrentRoundDTO(DTO):
    def __init__(self, current_round: 'Round', answered_questions: List['Question']):
        self.order = current_round.order
        self.themes = [ThemeDTO(theme, answered_questions) for theme in current_round.themes]

    def to_response(self):
        return dict(
            order=self.order,
            themes=[theme.to_response() for theme in self.themes]
        )


class RoundStartedDTO(DTO):
    def __init__(self, current_round: 'Round', current_player: 'Player'):
        self.round = CurrentRoundDTO(current_round, [])
        self.current_player = PlayerNicknameDTO(current_player)

    def to_response(self):
        return dict(
            round=self.round.to_response(),
            currentPlayer=self.current_player.to_response()
        )


class GameStateDTO(DTO):
    def __init__(self, gs: 'GameSession'):
        self.stage = gs.stage
        self.players = [PlayerDTO(player) for player in gs.players]
        self.current_round = CurrentRoundDTO(gs.current_round, gs.answered_questions) \
            if gs.current_round else None
        self.current_player = gs.current_player.nickname if gs.current_player else None
        self.current_question = CurrentQuestionDTO(gs.current_question) if gs.current_question else None

        if gs.stage in (Stage.FINAL_ROUND, Stage.END_GAME):
            self.final_round = FinalRoundQuestionDTO(gs.game.final_round,
                                                     with_answer=gs.stage == Stage.END_GAME)
        else:
            self.final_round = None

    def to_response(self):
        response = dict(
            stage=self.stage.name,
            players=[player.to_response() for player in self.players]
        )
        if self.current_round:
            response |= dict(currentRound=self.current_round.to_response())
        if self.current_player:
            response |= dict(currentPlayer=self.current_player)
        if self.current_question:
            response |= dict(currentQuestion=self.current_question.to_response())
        if self.final_round:
            response |= dict(finalRound=self.final_round.to_response())

        return response


class GameSessionDescriptionDTO(DTO):
    def __init__(self, gs: 'GameSession'):
        self.creator = gs.creator.nickname
        self.game_name = gs.game.name
        self.max_players = gs.max_players
        self.current_players = len(gs.players)

    def to_response(self):
        return dict(
            creator=self.creator,
            gameName=self.game_name,
            maxPlayers=self.max_players,
            currentPlayers=self.current_players
        )


class PlayerNicknameDTO(DTO):
    def __init__(self, player: 'Player'):
        self.nickname = player.nickname

    def to_response(self):
        return dict(nickname=self.nickname)


class ChosenQuestionDTO(DTO):
    def __init__(self, question: 'CurrentQuestion'):
        self.text = question.text
        self.theme_index = question.theme_index
        self.question_index = question.question_index

    def to_response(self):
        return dict(
            text=self.text,
            themeIndex=self.theme_index,
            questionIndex=self.question_index
        )


class FinalRoundTimeoutDTO(DTO):
    def __init__(self, gs: 'GameSession'):
        self.players = [PlayerDTO(player) for player in gs.players]
        self.answer = CorrectAnswerDTO(gs.game.final_round)

    def to_response(self):
        return dict(
            players=[dto.to_response() for dto in self.players],
            **self.answer.to_response()
        )


class CreatorNicknameDTO(DTO):
    def __init__(self, gs: 'GameSession'):
        self.nickname = gs.creator.nickname

    def to_response(self):
        return dict(creator=self.nickname)
