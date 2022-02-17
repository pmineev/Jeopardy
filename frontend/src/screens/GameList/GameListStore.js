import {types} from "mobx-state-tree";

const GameDescription = types
    .model({
        id: types.identifier,
        name: types.string,
        author: types.string,
        roundsCount: types.number
    })

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
                    descr.roundsCount)
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