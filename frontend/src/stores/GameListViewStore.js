import {types} from "mobx-state-tree";

const GameListViewStore = types
    .model({
        isCreateGameSessionFormOpen: false
    })
    .actions(self => ({
        toggleCreateGameSessionFormOpen() {
            self.isCreateGameSessionFormOpen = !self.isCreateGameSessionFormOpen;
        }
    }))

export default GameListViewStore;