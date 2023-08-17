from typing import Union

from backend.infra.consumers import GameSessionConsumer
from backend.infra.dispatcher import EventDispatcher
from backend.infra.notifiers import notify_to_lobby, notify_to_game_session
from backend.infra.timers import Timers, CHOOSING_QUESTION_INTERVAL, FINAL_ROUND_INTERVAL
from backend.modules.game_session.events import GameSessionCreatedEvent, GameSessionDeletedEvent, PlayerJoinedEvent, \
    PlayerLeftEvent, RoundStartedEvent, FinalRoundStartedEvent, CurrentQuestionChosenEvent, \
    PlayerCorrectlyAnsweredEvent, PlayerIncorrectlyAnsweredEvent, AnswerTimeoutEvent, FinalRoundTimeoutEvent, \
    PlayerInactiveEvent, PlayerActiveEvent, StartAnswerPeriodEvent, AnswersAllowedEvent, PlayerAnsweringEvent, \
    FinalRoundAnswersAllowedEvent, RestartAnswerPeriodEvent, StopAnswerPeriodEvent
from backend.modules.game_session.services import GameSessionService


def notify_of_game_session_created(event: GameSessionCreatedEvent):
    notify_to_lobby(event.game_session_description_dto, 'game_session_created')


def notify_of_game_session_deleted(event: GameSessionDeletedEvent):
    notify_to_lobby(event.creator_nickname_dto, 'game_session_deleted')


def notify_of_player_joined(event: PlayerJoinedEvent):
    notify_to_lobby(event.creator_nickname_dto, 'player_joined')
    notify_to_game_session(event.game_session_id, event.player_nickname_dto, 'player_joined')


def notify_of_player_active(event: PlayerJoinedEvent):
    notify_to_game_session(event.game_session_id, event.player_nickname_dto, 'player_joined')


def notify_of_player_left(event: PlayerLeftEvent):
    notify_to_lobby(event.creator_nickname_dto, 'player_left')
    notify_to_game_session(event.game_session_id, event.player_nickname_dto, 'player_left')


def notify_of_player_inactive(event: PlayerInactiveEvent):
    notify_to_game_session(event.game_session_id, event.player_nickname_dto, 'player_left')


def notify_of_round_started(event: RoundStartedEvent):
    notify_to_game_session(event.game_session_id, event.round_started_dto, 'round_started')


def notify_of_final_round_started(event: FinalRoundStartedEvent):
    notify_to_game_session(event.game_session_id, event.final_round_dto, 'final_round_started')


def notify_of_current_question_chosen(event: CurrentQuestionChosenEvent):
    notify_to_game_session(event.game_session_id, event.current_question_dto, 'current_question_chosen')


def notify_of_answers_allowed(event: AnswersAllowedEvent | FinalRoundAnswersAllowedEvent):
    notify_to_game_session(event.game_session_id, {}, 'answers_allowed')


def notify_of_player_answering(event: PlayerAnsweringEvent):
    notify_to_game_session(event.game_session_id, event.player_nickname_dto, 'player_answering')


def notify_of_player_answered(event: Union[PlayerCorrectlyAnsweredEvent, PlayerIncorrectlyAnsweredEvent]):
    notify_to_game_session(event.game_session_id, event.player_dto, 'player_answered')


def notify_of_answer_timeout(event: AnswerTimeoutEvent):
    notify_to_game_session(event.game_session_id, event.answer_dto, 'question_timeout')


def notify_of_final_round_timeout(event: FinalRoundTimeoutEvent):
    notify_to_game_session(event.game_session_id, event.final_round_timeout_dto, 'final_round_timeout')


def add_creator_to_notifier(event: GameSessionCreatedEvent):
    GameSessionConsumer.add_user(event.creator_username, event.game_session_id)


def add_player_to_notifier(event: PlayerJoinedEvent):
    GameSessionConsumer.add_user(event.player_username, event.game_session_id)


def remove_player_from_notifier(event: PlayerLeftEvent):
    GameSessionConsumer.remove_user(event.player_username)


def remove_group_from_notifier(event: GameSessionDeletedEvent):
    GameSessionConsumer.remove_group(event.game_session_id)


def start_question_timer(event: StartAnswerPeriodEvent):
    service = GameSessionService()

    Timers.start(key=event.game_session_id,
                 interval=CHOOSING_QUESTION_INTERVAL,
                 callback=service.answer_timeout,
                 args=(event.game_session_id,))


def stop_question_timer(event: Union[PlayerCorrectlyAnsweredEvent, GameSessionDeletedEvent]):
    Timers.stop(event.game_session_id)


def restart_question_timer(event: PlayerIncorrectlyAnsweredEvent):
    service = GameSessionService()

    Timers.stop(event.game_session_id)
    Timers.start(key=event.game_session_id,
                 interval=CHOOSING_QUESTION_INTERVAL,
                 callback=service.answer_timeout,
                 args=(event.game_session_id,))


def start_final_round_timer(event: FinalRoundStartedEvent):
    service = GameSessionService()

    Timers.start(key=event.game_session_id,
                 interval=FINAL_ROUND_INTERVAL,
                 callback=service.final_round_timeout,
                 args=(event.game_session_id,))


def register_handlers():
    EventDispatcher.register_handler(notify_of_game_session_created, GameSessionCreatedEvent)
    EventDispatcher.register_handler(notify_of_game_session_deleted, GameSessionDeletedEvent)
    EventDispatcher.register_handler(notify_of_player_joined, PlayerJoinedEvent)
    EventDispatcher.register_handler(notify_of_player_active, PlayerActiveEvent)
    EventDispatcher.register_handler(notify_of_player_left, PlayerLeftEvent)
    EventDispatcher.register_handler(notify_of_player_inactive, PlayerInactiveEvent)
    EventDispatcher.register_handler(notify_of_round_started, RoundStartedEvent)
    EventDispatcher.register_handler(notify_of_final_round_started, FinalRoundStartedEvent)
    EventDispatcher.register_handler(notify_of_current_question_chosen, CurrentQuestionChosenEvent)
    EventDispatcher.register_handler(notify_of_answers_allowed, AnswersAllowedEvent)
    EventDispatcher.register_handler(notify_of_answers_allowed, FinalRoundAnswersAllowedEvent)
    EventDispatcher.register_handler(notify_of_player_answering, PlayerAnsweringEvent)
    EventDispatcher.register_handler(notify_of_player_answered, PlayerCorrectlyAnsweredEvent)
    EventDispatcher.register_handler(notify_of_player_answered, PlayerIncorrectlyAnsweredEvent)
    EventDispatcher.register_handler(notify_of_answer_timeout, AnswerTimeoutEvent)
    EventDispatcher.register_handler(notify_of_final_round_timeout, FinalRoundTimeoutEvent)
    EventDispatcher.register_handler(add_creator_to_notifier, GameSessionCreatedEvent)
    EventDispatcher.register_handler(add_player_to_notifier, PlayerJoinedEvent)
    EventDispatcher.register_handler(remove_player_from_notifier, PlayerLeftEvent)
    EventDispatcher.register_handler(remove_group_from_notifier, GameSessionDeletedEvent)
    EventDispatcher.register_handler(start_question_timer, StartAnswerPeriodEvent)
    EventDispatcher.register_handler(start_question_timer, AnswersAllowedEvent)
    EventDispatcher.register_handler(stop_question_timer, PlayerAnsweringEvent)
    EventDispatcher.register_handler(stop_question_timer, StopAnswerPeriodEvent)
    EventDispatcher.register_handler(stop_question_timer, GameSessionDeletedEvent)
    EventDispatcher.register_handler(restart_question_timer, RestartAnswerPeriodEvent)
    EventDispatcher.register_handler(start_final_round_timer, FinalRoundAnswersAllowedEvent)
