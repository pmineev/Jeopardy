import {types} from "mobx-state-tree";

const GameSessionDescription = types
    .model({
        creator: types.identifier,
        gameName: types.string,
        maxPlayers: types.number,
        currentPlayers: types.number

    })
    .actions(self => ({
        setPlayerJoined() {
            self.currentPlayers += 1;
        },
        setPlayerLeft() {
            self.currentPlayers -= 1;
        }
    }))

const LobbyStore = types
    .model({
        descriptions: types.map(GameSessionDescription)
    })
    .actions(self => ({
        eventHandler(event, data) {
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

export default LobbyStore;