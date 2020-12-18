from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from backend.serializers import GameSessionDescriptionSerializer


class GameSessionNotifier:
    def __init__(self, repo):
        self.channel_layer = get_channel_layer()
        self.repo = repo

    def _notify(self, group_name, notification_dict, type, event):
        notification_dict.update(
            {
                'type': type,
                'event': event
            }
        )
        async_to_sync(self.channel_layer.group_send)(group_name, notification_dict)

    def created(self, game_session_id):
        game_session_description = self.repo.get_description(game_session_id)
        description_dict = GameSessionDescriptionSerializer(game_session_description).data

        self._notify('lobby', description_dict, 'lobby_event', 'created')

    def deleted(self, game_session_id):
        deletion_dict = dict(game_session_id=str(game_session_id))

        self._notify('lobby', deletion_dict, 'lobby_event', 'deleted')

    def joined(self, game_session_id):
        join_dict = dict(game_session_id=str(game_session_id))

        self._notify('lobby', join_dict, 'lobby_event', 'joined')

    def left(self, game_session_id):
        leave_dict = dict(game_session_id=str(game_session_id))

        self._notify('lobby', leave_dict, 'lobby_event', 'left')
