import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer


class LobbyConsumer(WebsocketConsumer):
    group_name = 'lobby'

    def connect(self):
        async_to_sync(self.channel_layer.group_add)(LobbyConsumer.group_name, self.channel_name)

        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(LobbyConsumer.group_name, self.channel_name)

        self.close()

    def receive_json(self, content, **kvargs):
        async_to_sync(self.channel_layer.group_send)(
            LobbyConsumer.group_name,
            {
                'type': 'lobby_event'
            })

    def lobby_event(self, event):
        # event.pop('type')
        self.send(json.dumps(event, ensure_ascii=False))


class GameSessionConsumer(WebsocketConsumer):
    def __init__(self):
        super().__init__()

    def connect(self):
        self.group_name = self.scope['url_route']['kwargs']['game_session_id']

        async_to_sync(self.channel_layer.group_add)(self.group_name, self.channel_name)

        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(self.group_name, self.channel_name)

        self.close()

    def game_session_event(self, event):
        self.send(json.dumps(event, ensure_ascii=False))
