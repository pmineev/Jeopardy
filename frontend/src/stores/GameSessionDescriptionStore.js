import {types} from "mobx-state-tree";

import GameSessionDescription from "./GameSessionDescription";

const GameSessionDescriptionStore = types
    .model({
        descriptions: types.map(GameSessionDescription)
    })
    .actions(self => ({
        listener(event, data) {
            const handlers = {
                'game_session_created': self.onGameSessionCreated,
                'game_session_deleted': self.onGameSessionDeleted,
                'player_joined': self.onPlayerJoined,
                'player_left': self.onPlayerLeft
            }

            handlers[event](data);
        },
        onGameSessionCreated(data) {
            self.addDescription(data.creator, data.creator, data.gameName, data.maxPlayers, data.currentPlayers);
        },
        onGameSessionDeleted(data) {
            self.deleteDescription(data.creator);
        },
        onPlayerJoined(data) {
            self.descriptions.get(data.creator).setPlayerJoined();
        },
        onPlayerLeft(data) {
            console.log(self.descriptions)
            let descr = self.descriptions.get(data.creator);
            if (descr) {
                self.descriptions.get(data.creator).setPlayerLeft();
            }
            console.log(self.descriptions)
        },
        initialize(data) {
            data.forEach(descr =>
                self.addDescription(
                    descr.creator,
                    descr.creator,
                    descr.gameName,
                    descr.maxPlayers,
                    descr.currentPlayers))
        },
        addDescription(id, creator, gameName, maxPlayers, currentPlayers) {
            self.descriptions.set(id, GameSessionDescription.create({
                id, creator, gameName, maxPlayers, currentPlayers
            }))
        },
        deleteDescription(id) {
            self.descriptions.delete(id);
        }
    }))

export default GameSessionDescriptionStore;