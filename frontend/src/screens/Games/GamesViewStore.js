import {types} from "mobx-state-tree";

const GamesViewStore = types
    .model({
        isCreateGameSessionFormOpen: false
    })
    .actions(self => ({
        toggleCreateGameSessionFormOpen() {
            self.isCreateGameSessionFormOpen = !self.isCreateGameSessionFormOpen;
        }
    }))

export default GamesViewStore;