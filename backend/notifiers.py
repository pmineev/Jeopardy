from typing import Dict, Union, TYPE_CHECKING

if TYPE_CHECKING:
    from backend.events import GameSessionCreatedEvent, PlayerJoinedEvent, PlayerLeftEvent, RoundStartedEvent, \
        FinalRoundStartedEvent, CurrentPlayerChosenEvent, CurrentQuestionChosenEvent, AnswerTimeoutEvent, \
        FinalRoundTimeoutEvent, GameSessionDeletedEvent, PlayerCorrectlyAnsweredEvent, \
        PlayerIncorrectlyAnsweredEvent

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from backend.dtos import GameSessionDescriptionDTO, GameSessionIdDTO, CurrentRoundDTO, FinalRoundQuestionDTO, \
    PlayerNicknameDTO, ChosenQuestionDTO, FinalRoundTimeoutDTO, PlayerDTO, CorrectAnswerDTO

channel_layer = get_channel_layer()


def websocket_notify(group_name: str, data: Dict, notification_type: str, event_type: str):
    notification_dict = {
        'type': notification_type,
        'event': event_type,
        'data': data
    }

    async_to_sync(channel_layer.group_send)(group_name, notification_dict)


def notify_to_lobby(data: Dict, event_type: str):
    websocket_notify('lobby', data, 'lobby_event', event_type)


def notify_to_game_session(game_session_id: int, data: Dict, event_type: str):
    websocket_notify(str(game_session_id), data, 'game_session_event', event_type)


def notify_of_game_session_created(event: 'GameSessionCreatedEvent'):
    gs = event.game_session

    # TODO здесь id == None

    notify_to_lobby(GameSessionDescriptionDTO(gs).to_response(), 'game_session_created')


def notify_of_game_session_deleted(event: 'GameSessionDeletedEvent'):
    gs = event.game_session

    notify_to_lobby(GameSessionIdDTO(gs).to_response(), 'game_session_deleted')


def notify_of_player_joined(event: 'PlayerJoinedEvent'):
    gs = event.game_session
    player = event.player

    notify_to_lobby(GameSessionIdDTO(gs).to_response(), 'player_joined')
    notify_to_game_session(gs.id, PlayerNicknameDTO(player).to_response(), 'player_joined')


def notify_of_player_left(event: 'PlayerLeftEvent'):
    gs = event.game_session
    player = event.player

    notify_to_lobby(GameSessionIdDTO(gs).to_response(), 'player_left')
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


def notify_of_question_timeout(event: 'AnswerTimeoutEvent'):
    gs = event.game_session
    question = event.question

    notify_to_game_session(gs.id, CorrectAnswerDTO(question).to_response(), 'question_timeout')


def notify_of_final_round_timeout(event: 'FinalRoundTimeoutEvent'):
    gs = event.game_session

    notify_to_game_session(gs.id, FinalRoundTimeoutDTO(gs).to_response(), 'final_round_timeout')
