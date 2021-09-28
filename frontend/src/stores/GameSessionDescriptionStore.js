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
                    self.addDescription(data.id, data.creator, data.game_name, data.max_players, data.current_players);
                    break;
                }
                case 'game_session_deleted': {
                    self.deleteDescription(data.id);
                    break;
                }
                case 'player_joined': {
                    self.descriptions.get(data.id).setPlayerJoined();
                    break;
                }
                case 'player_left': {
                    console.log(self.descriptions)
                    let descr = self.descriptions.get(data.id);
                    if (descr) {
                        self.descriptions.get(data.id).setPlayerLeft();
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
                    descr.id,
                    descr.creator,
                    descr.game_name,
                    descr.max_players,
                    descr.current_players))
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