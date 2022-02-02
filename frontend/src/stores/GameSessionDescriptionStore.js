import {types} from "mobx-state-tree";

import GameSessionDescription from "./GameSessionDescription";

const GameSessionDescriptionStore = types
    .model({
        descriptions: types.map(GameSessionDescription)
    })
    .actions(self => ({
        listener(event, data) {
            console.log("lobby", event, data);
            const handlers = {
                'game_session_created': self.onGameSessionCreated,
                'game_session_deleted': self.onGameSessionDeleted,
                'player_joined': self.onPlayerJoined,
                'player_left': self.onPlayerLeft
            }

            handlers[event](data);
        },
        onGameSessionCreated(data) {
            self.descriptions.put(data);
        },
        onGameSessionDeleted(data) {
            self.descriptions.delete(data.creator);
        },
        onPlayerJoined(data) {
            self.descriptions.get(data.creator).setPlayerJoined();
        },
        onPlayerLeft(data) {
            self.descriptions.get(data.creator).setPlayerLeft();
        },
        initialize(data) {
            data.forEach(descriptionData =>
                self.descriptions.put(descriptionData)
            )
        }
    }))

export default GameSessionDescriptionStore;