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

export default GameSessionDescription;