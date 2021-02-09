from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from backend.serializers import GameSessionDescriptionSerializer, RoundDescriptionSerializer, PlayerSerializer, \
    QuestionDescriptionSerializer


class GameSessionNotifier:
    def __init__(self, repo):
        self.channel_layer = get_channel_layer()
        self.repo = repo

    def _notify(self, group_name, data, type, event):
        notification_dict = {
            'type': type,
            'event': event,
            'data': data
        }

        async_to_sync(self.channel_layer.group_send)(group_name, notification_dict)

    def game_session_created(self, game_session_id):
        game_session_description = self.repo.get_description(game_session_id)
        description_dict = GameSessionDescriptionSerializer(game_session_description).data

        self._notify('lobby', description_dict, 'lobby_event', 'game_session_created')

    def game_session_deleted(self, game_session_id):
        deletion_dict = dict(game_session_id=game_session_id)

        self._notify('lobby', deletion_dict, 'lobby_event', 'game_session_deleted')

    def player_joined(self, game_session_id, username):
        join_dict = dict(game_session_id=game_session_id)

        player = self.repo.get_player(game_session_id, username)
        player_dict = PlayerSerializer(player).data

        self._notify('lobby', join_dict, 'lobby_event', 'player_joined')
        self._notify(str(game_session_id), player_dict, 'game_session_event', 'player_joined')

    def player_left(self, game_session_id, username):
        leave_dict = dict(game_session_id=game_session_id)

        player = self.repo.get_player(game_session_id, username)
        player_dict = PlayerSerializer(player).data

        self._notify('lobby', leave_dict, 'lobby_event', 'player_left')
        self._notify(str(game_session_id), player_dict, 'game_session_event', 'player_left')

    def round_started(self, game_session_id):
        round_description = self.repo.get_current_round_description(game_session_id)
        round_dict = RoundDescriptionSerializer(round_description).data

        self._notify(str(game_session_id), round_dict, 'game_session_event', 'round_started')

    def final_round_started(self, game_session_id):
        question_description = self.repo.get_final_round_description(game_session_id)
        question_dict = QuestionDescriptionSerializer(question_description).data

        self._notify(str(game_session_id), question_dict, 'game_session_event', 'final_round_started')

    def current_player_chosen(self, game_session_id):
        player = self.repo.get_current_player(game_session_id)
        player_dict = PlayerSerializer(player).data

        self._notify(str(game_session_id), player_dict, 'game_session_event', 'current_player_chosen')

    def current_question_chosen(self, game_session_id, theme_order, question_order):
        question_description = self.repo.get_current_question(game_session_id)
        question_dict = QuestionDescriptionSerializer(question_description).data
        question_dict.update(
            {
                'theme_order': theme_order,
                'question_order': question_order
            }
        )

        self._notify(str(game_session_id), question_dict, 'game_session_event', 'current_question_chosen')

    def player_answered(self, game_session_id, username, answer, is_correct=True):
        player = self.repo.get_player(game_session_id, username)
        player_dict = PlayerSerializer(player).data
        answer_dict = {
            'player': player_dict,
            'text': answer,
            'is_correct': is_correct
        }

        self._notify(str(game_session_id), answer_dict, 'game_session_event', 'player_answered')

    def question_timeout(self, game_session_id):
        answer = self.repo.get_current_question_answer(game_session_id)
        answer_dict = dict(text=answer)

        self._notify(str(game_session_id), answer_dict, 'game_session_event', 'question_timeout')

    def final_round_timeout(self, game_session_id):
        players = self.repo.get_all_players(game_session_id)
        players_list = [PlayerSerializer(player).data for player in players]
        players_dict = dict(players=players_list)

        self._notify(str(game_session_id), players_dict, 'game_session_event', 'final_round_timeout')
