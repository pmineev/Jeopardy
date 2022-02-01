from typing import Dict

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

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
    websocket_notify(f'game_session_{game_session_id}', data, 'game_session_event', event_type)
