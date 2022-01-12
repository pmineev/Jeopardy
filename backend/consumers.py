import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


class LobbyConsumer(WebsocketConsumer):
    groups = ['lobby']

    def lobby_event(self, event):
        event_type = event.pop('type')
        self.send(json.dumps(event, ensure_ascii=False))
        event['type'] = event_type


class GameSessionConsumer(WebsocketConsumer):
    def connect(self):
        self.group_name = self.scope['url_route']['kwargs']['game_session_id']

        async_to_sync(self.channel_layer.group_add)(self.group_name, self.channel_name)

        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(self.group_name, self.channel_name)

        self.close()

    def game_session_event(self, event):
        event_type = event.pop('type')
        self.send(json.dumps(event, ensure_ascii=False))
        event['type'] = event_type
