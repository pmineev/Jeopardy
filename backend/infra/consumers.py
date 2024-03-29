import json
from typing import Dict

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


class LobbyConsumer(WebsocketConsumer):
    groups = ['lobby']

    def lobby_event(self, event):
        event_type = event.pop('type')
        self.send(json.dumps(event, ensure_ascii=False))
        event['type'] = event_type


class GameSessionConsumer(WebsocketConsumer):
    group_names: Dict[str, str] = dict()

    @classmethod
    def add_user(cls, username: str, game_session_id: int):
        cls.group_names[username] = f'game_session_{game_session_id}'

        print(f'added {username}@{game_session_id} to notifier')

    @classmethod
    def remove_user(cls, username: str):
        cls.group_names.pop(username, None)

        print(f'removed {username} from notifier')

    @classmethod
    def remove_group(cls, game_session_id: int):
        group_name = f'game_session_{game_session_id}'
        cls.group_names = {k: v for k, v in cls.group_names.items() if v != group_name}

        print(f'removed group {group_name} from notifier')

    def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        if data and 'username' in data:
            self._add_user_to_group(data['username'])
        else:
            self.close()

    def _add_user_to_group(self, username: str):
        async_to_sync(self.channel_layer.group_add)(self.group_names[username], self.channel_name)

        print(f'added {username} to group')

    def game_session_event(self, event):
        event_type = event.pop('type')
        self.send(json.dumps(event, ensure_ascii=False))
        event['type'] = event_type


