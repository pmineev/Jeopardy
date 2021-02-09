import json
import pprint

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
        event.pop('type')
        self.send(json.dumps(event, ensure_ascii=False))


history = {}


class GameSessionConsumer(WebsocketConsumer):
    def __init__(self):
        super().__init__()

    def connect(self):
        self.group_name = self.scope['url_route']['kwargs']['game_session_id']

        async_to_sync(self.channel_layer.group_add)(self.group_name, self.channel_name)

        self.accept()

        pprint.pprint(history)
        print(self.group_name)
        print(self.channel_name)
        print(self.group_name in history)
        if self.group_name in history:
            for event in history[self.group_name]:
                if 'sent' in event:
                    print('e', self.channel_name not in event['sent'])
                    if self.channel_name not in event['sent']:
                        print(event)
                        event.pop('sent')
                        async_to_sync(self.channel_layer.send)(self.channel_name, event)

    def disconnect(self, close_code):
        print(self.channel_layer.groups)
        async_to_sync(self.channel_layer.group_discard)(self.group_name, self.channel_name)

        pprint.pprint(history)
        print(self.channel_layer.groups)
        if self.group_name not in self.channel_layer.groups:
            if self.group_name in history:
                history.pop(self.group_name)
                print('group history deleted')

        self.close()

    def game_session_event(self, event):
        print(event['event'])

        if self.group_name not in history:
            history[self.group_name] = []

        if 'sent' not in event:
            e = dict(event)
            e['sent'] = dict(self.channel_layer.groups[self.group_name])
            history[self.group_name].append(e)
            pprint.pprint(e)
        self.send(json.dumps(event, ensure_ascii=False))
