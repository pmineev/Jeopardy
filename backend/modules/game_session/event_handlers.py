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


def notify_of_game_session_created(event: 'GameSessionCreatedEvent'):
    notify_to_lobby(event.game_session_description_dto, 'game_session_created')


def notify_of_game_session_deleted(event: 'GameSessionDeletedEvent'):
    notify_to_lobby(event.creator_nickname_dto, 'game_session_deleted')


def notify_of_player_joined(event: 'PlayerJoinedEvent'):
    notify_to_lobby(event.creator_nickname_dto, 'player_joined')
    notify_to_game_session(event.game_session_id, event.player_nickname_dto, 'player_joined')


def notify_of_player_left(event: 'PlayerLeftEvent'):
    notify_to_lobby(event.creator_nickname_dto, 'player_left')
    notify_to_game_session(event.game_session_id, event.player_nickname_dto, 'player_left')


def notify_of_player_inactive(event: 'PlayerInactiveEvent'):
    notify_to_game_session(event.game_session_id, event.player_nickname_dto, 'player_left')


def notify_of_round_started(event: 'RoundStartedEvent'):
    notify_to_game_session(event.game_session_id, event.current_round_dto, 'round_started')


def notify_of_final_round_started(event: 'FinalRoundStartedEvent'):
    notify_to_game_session(event.game_session_id, event.final_round_dto, 'final_round_started')


def notify_of_current_player_chosen(event: 'CurrentPlayerChosenEvent'):
    notify_to_game_session(event.game_session_id, event.player_nickname_dto, 'current_player_chosen')


def notify_of_current_question_chosen(event: 'CurrentQuestionChosenEvent'):
    notify_to_game_session(event.game_session_id, event.current_question_dto, 'current_question_chosen')


def notify_of_player_answered(event: Union['PlayerCorrectlyAnsweredEvent', 'PlayerIncorrectlyAnsweredEvent']):
    notify_to_game_session(event.game_session_id, event.player_dto, 'player_answered')


def notify_of_answer_timeout(event: 'AnswerTimeoutEvent'):
    notify_to_game_session(event.game_session_id, event.answer_dto, 'question_timeout')


def notify_of_final_round_timeout(event: 'FinalRoundTimeoutEvent'):
    notify_to_game_session(event.game_session_id, event.final_round_timeout_dto, 'final_round_timeout')


def add_creator_to_notifier(event: 'GameSessionCreatedEvent'):
    GameSessionConsumer.add_user(event.creator_username, event.game_session_id)


def add_player_to_notifier(event: 'PlayerJoinedEvent'):
    GameSessionConsumer.add_user(event.player_username, event.game_session_id)


def remove_player_from_notifier(event: 'PlayerLeftEvent'):
    GameSessionConsumer.remove_user(event.player_username)


def remove_group_from_notifier(event: 'GameSessionDeletedEvent'):
    GameSessionConsumer.remove_group(event.game_session_id)


def start_question_timer(event: 'CurrentQuestionChosenEvent'):
    service = factories.GameSessionFactory.get()

    Timers.start(key=event.game_session_id,
                 interval=CHOOSING_QUESTION_INTERVAL,
                 callback=service.answer_timeout,
                 args=(event.game_session_id,))


def stop_question_timer(event: Union['PlayerCorrectlyAnsweredEvent', 'GameSessionDeletedEvent']):
    Timers.stop(event.game_session_id)


def restart_question_timer(event: 'PlayerIncorrectlyAnsweredEvent'):
    service = factories.GameSessionFactory.get()

    Timers.stop(event.game_session_id)
    Timers.start(key=event.game_session_id,
                 interval=CHOOSING_QUESTION_INTERVAL,
                 callback=service.answer_timeout,
                 args=(event.game_session_id,))


def start_final_round_timer(event: 'FinalRoundStartedEvent'):
    service = factories.GameSessionFactory.get()

    Timers.start(key=event.game_session_id,
                 interval=FINAL_ROUND_INTERVAL,
                 callback=service.final_round_timeout,
                 args=(event.game_session_id,))
