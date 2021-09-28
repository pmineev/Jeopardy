import {types} from "mobx-state-tree";

import GameDescription from "./GameDescription";

const GameListStore = types
    .model({
        descriptions: types.map(GameDescription),
        chosenGame: types.maybe(types.reference(GameDescription))
    })
    .actions(self => ({
        set(data) {
            data.forEach(descr => {
                self.addDescription(
                    descr.name,
                    descr.name,
                    descr.author,
                    descr.rounds_count)
            });
        },
        addDescription(id, name, author, roundsCount) {
            self.descriptions.set(id, GameDescription.create({
                id, name, author, roundsCount
            }))
        },
        setChosenGame(description) {
            self.chosenGame = description;
        }
    }))

export default GameListStore;