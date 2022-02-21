import {types} from "mobx-state-tree";

const GameDescription = types
    .model({
        name: types.identifier,
        author: types.string,
        roundsCount: types.number
    })

const GamesStore = types
    .model({
        descriptions: types.map(GameDescription),
        chosenGame: types.maybe(types.reference(GameDescription))
    })
    .actions(self => ({
        initialize(data) {
            data.forEach(descr => {
                self.addDescription(
                    descr.name,
                    descr.author,
                    descr.roundsCount)
            });
        },
        addDescription(name, author, roundsCount) {
            self.descriptions.set(name, GameDescription.create({
                name, author, roundsCount
            }))
        },
        setChosenGame(description) {
            self.chosenGame = description;
        }
    }))

export default GamesStore;