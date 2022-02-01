import {types} from "mobx-state-tree";

import GameSessionDescription from "./GameSessionDescription";

const GameSessionDescriptionStore = types
    .model({
        descriptions: types.map(GameSessionDescription)
    })
    .actions(self => ({
        listener(event, data) {
            switch (event) {
                case 'init': {
                    self.init(data);
                    break;
                }
                case 'game_session_created': {
                    self.addDescription(data.creator, data.creator, data.gameName, data.maxPlayers, data.currentPlayers);
                    break;
                }
                case 'game_session_deleted': {
                    self.deleteDescription(data.creator);
                    break;
                }
                case 'player_joined': {
                    self.descriptions.get(data.creator).setPlayerJoined();
                    break;
                }
                case 'player_left': {
                    console.log(self.descriptions)
                    let descr = self.descriptions.get(data.creator);
                    if (descr) {
                        self.descriptions.get(data.creator).setPlayerLeft();
                    }
                    console.log(self.descriptions)
                    break;
                }
                default:
                    throw new Error('нет такого события')
            }
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