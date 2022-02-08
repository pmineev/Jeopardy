from typing import Union, TYPE_CHECKING

if TYPE_CHECKING:
    from .events import GameSessionCreatedEvent, GameSessionDeletedEvent, PlayerJoinedEvent, PlayerLeftEvent, \
        RoundStartedEvent, FinalRoundStartedEvent, CurrentPlayerChosenEvent, CurrentQuestionChosenEvent, \
        PlayerCorrectlyAnsweredEvent, PlayerIncorrectlyAnsweredEvent, AnswerTimeoutEvent, FinalRoundTimeoutEvent, \
        PlayerInactiveEvent

from ...infra import factories
from ...infra.consumers import GameSessionConsumer
from ...infra.notifiers import notify_to_lobby, notify_to_game_session
from ...infra.timers import Timers, CHOOSING_QUESTION_INTERVAL, FINAL_ROUND_INTERVAL
from .dtos import GameSessionDescriptionDTO, CreatorNicknameDTO, PlayerNicknameDTO, \
    CurrentRoundDTO, FinalRoundQuestionDTO, ChosenQuestionDTO, PlayerDTO, CorrectAnswerDTO, FinalRoundTimeoutDTO


def notify_of_game_session_created(event: 'GameSessionCreatedEvent'):
    gs = event.game_session

    notify_to_lobby(GameSessionDescriptionDTO(gs).to_response(), 'game_session_created')


def notify_of_game_session_deleted(event: 'GameSessionDeletedEvent'):
    gs = event.game_session

    notify_to_lobby(CreatorNicknameDTO(gs).to_response(), 'game_session_deleted')


def notify_of_player_joined(event: 'PlayerJoinedEvent'):
    gs = event.game_session
    player = event.player

    notify_to_lobby(CreatorNicknameDTO(gs).to_response(), 'player_joined')
    notify_to_game_session(gs.id, PlayerNicknameDTO(player).to_response(), 'player_joined')


def notify_of_player_left(event: 'PlayerLeftEvent'):
    gs = event.game_session
    player = event.player

    notify_to_lobby(CreatorNicknameDTO(gs).to_response(), 'player_left')
    notify_to_game_session(gs.id, PlayerNicknameDTO(player).to_response(), 'player_left')


def notify_of_player_inactive(event: 'PlayerInactiveEvent'):
    gs = event.game_session
    player = event.player

    notify_to_game_session(gs.id, PlayerNicknameDTO(player).to_response(), 'player_left')


def notify_of_round_started(event: 'RoundStartedEvent'):
    gs = event.game_session
    current_round = event.round

    current_round_dto = CurrentRoundDTO(current_round, [])

    notify_to_game_session(gs.id, current_round_dto.to_response(), 'round_started')


def notify_of_final_round_started(event: 'FinalRoundStartedEvent'):
    gs = event.game_session
    final_round_question = event.final_round

    question_dto = FinalRoundQuestionDTO(final_round_question,
                                         with_answer=False)

    notify_to_game_session(gs.id, question_dto.to_response(), 'final_round_started')


def notify_of_current_player_chosen(event: 'CurrentPlayerChosenEvent'):
    gs = event.game_session
    player = event.player

    notify_to_game_session(gs.id, PlayerNicknameDTO(player).to_response(), 'current_player_chosen')


def notify_of_current_question_chosen(event: 'CurrentQuestionChosenEvent'):
    gs = event.game_session
    current_question = event.question

    notify_to_game_session(gs.id, ChosenQuestionDTO(current_question).to_response(), 'current_question_chosen')


def notify_of_player_answered(event: Union['PlayerCorrectlyAnsweredEvent', 'PlayerIncorrectlyAnsweredEvent']):
    gs = event.game_session
    player = event.player

    notify_to_game_session(gs.id, PlayerDTO(player).to_response(), 'player_answered')


def notify_of_answer_timeout(event: 'AnswerTimeoutEvent'):
    gs = event.game_session
    question = event.question

    notify_to_game_session(gs.id, CorrectAnswerDTO(question).to_response(), 'question_timeout')


def notify_of_final_round_timeout(event: 'FinalRoundTimeoutEvent'):
    gs = event.game_session

    notify_to_game_session(gs.id, FinalRoundTimeoutDTO(gs).to_response(), 'final_round_timeout')


def add_creator_to_notifier(event: 'GameSessionCreatedEvent'):
    game_session_id = event.game_session.id
    creator_username = event.game_session.creator.username

    GameSessionConsumer.add_user(creator_username, game_session_id)


def add_player_to_notifier(event: 'PlayerJoinedEvent'):
    game_session_id = event.game_session.id
    player_username = event.player.user.username

    GameSessionConsumer.add_user(player_username, game_session_id)


def remove_player_from_notifier(event: 'PlayerLeftEvent'):
    player_username = event.player.user.username

    GameSessionConsumer.remove_user(player_username)


def remove_group_from_notifier(event: 'GameSessionDeletedEvent'):
    game_session_id = event.game_session.id

    GameSessionConsumer.remove_group(game_session_id)


def start_question_timer(event: 'CurrentQuestionChosenEvent'):
    gs = event.game_session
    service = factories.GameSessionFactory.get()

    Timers.start(key=gs.id,
                 interval=CHOOSING_QUESTION_INTERVAL,
                 callback=service.answer_timeout,
                 args=(gs.id,))


def stop_question_timer(event: 'PlayerCorrectlyAnsweredEvent'):
    gs = event.game_session

    Timers.stop(gs.id)


def restart_question_timer(event: 'PlayerIncorrectlyAnsweredEvent'):
    gs = event.game_session
    service = factories.GameSessionFactory.get()

    Timers.stop(gs.id)
    Timers.start(key=gs.id,
                 interval=CHOOSING_QUESTION_INTERVAL,
                 callback=service.answer_timeout,
                 args=(gs.id,))


def start_final_round_timer(event: 'FinalRoundStartedEvent'):
    gs = event.game_session
    service = factories.GameSessionFactory.get()

    Timers.start(key=gs.id,
                 interval=FINAL_ROUND_INTERVAL,
                 callback=service.final_round_timeout,
                 args=(gs.id,))
