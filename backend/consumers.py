from channels.generic.websocket import JsonWebsocketConsumer


class LobbyConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.accept()

    def disconnect(self, close_code):
        self.close()

    def receive_json(self, content, **kvargs):
        self.send_json(str({**self.scope, **content}))


class GameSessionConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.accept()

    def disconnect(self, close_code):
        self.close()

    def receive_json(self, content, **kvargs):
        self.send_json(str({**self.scope, **content}))
