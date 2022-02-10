import {types} from "mobx-state-tree";

const GameDescription = types
    .model({
        id: types.identifier,
        name: types.string,
        author: types.string,
        roundsCount: types.number
    })

export default GameDescription;