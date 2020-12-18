from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer


class LobbyConsumer(JsonWebsocketConsumer):
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
        self.send_json(str({**self.scope, **event}))


class GameSessionConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.group_name = self.scope['url_route']['kwargs']['game_session_id']

        async_to_sync(self.channel_layer.group_add)(self.group_name, self.channel_name)

        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(self.group_name, self.channel_name)

        self.close()

    def receive_json(self, content, **kvargs):
        async_to_sync(self.channel_layer.group_send)(
            self.group_name,
            {
                'type': 'game_session_event'
            })

    def game_session_event(self, event):
        self.send_json(str({**self.scope, **event}))
