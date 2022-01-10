from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from entities import Entity

from backend.events import GameSessionCreatedEvent, GameSessionDeletedEvent, PlayerJoinedEvent, PlayerLeftEvent, \
    RoundStartedEvent, CurrentPlayerChosenEvent, CurrentQuestionChosenEvent, PlayerCorrectlyAnsweredEvent, \
    PlayerIncorrectlyAnsweredEvent, FinalRoundStartedEvent, AnswerTimeoutEvent, FinalRoundTimeoutEvent
from backend.notifiers import notify_of_game_session_created, notify_of_game_session_deleted, notify_of_player_joined, \
    notify_of_player_left, notify_of_round_started, notify_of_current_player_chosen, \
    notify_of_current_question_chosen, notify_of_player_answered, notify_of_final_round_started, \
    notify_of_question_timeout, notify_of_final_round_timeout
from backend.timers import start_question_timer, stop_question_timer, restart_question_timer, start_final_round_timer

EVENT_HANDLERS = {
    GameSessionCreatedEvent: [notify_of_game_session_created],
    GameSessionDeletedEvent: [notify_of_game_session_deleted],
    PlayerJoinedEvent: [notify_of_player_joined],
    PlayerLeftEvent: [notify_of_player_left],
    RoundStartedEvent: [notify_of_round_started],
    CurrentPlayerChosenEvent: [notify_of_current_player_chosen],
    CurrentQuestionChosenEvent: [notify_of_current_question_chosen, start_question_timer],
    PlayerCorrectlyAnsweredEvent: [notify_of_player_answered, stop_question_timer],
    PlayerIncorrectlyAnsweredEvent: [notify_of_player_answered, restart_question_timer],
    FinalRoundStartedEvent: [notify_of_final_round_started, start_final_round_timer],
    AnswerTimeoutEvent: [notify_of_question_timeout],
    FinalRoundTimeoutEvent: [notify_of_final_round_timeout],
}


def dispatch_events(entity: 'Entity'):
    events = entity.get_events()
    for event in events:
        for handler in EVENT_HANDLERS[type(event)]:
            handler(event)
