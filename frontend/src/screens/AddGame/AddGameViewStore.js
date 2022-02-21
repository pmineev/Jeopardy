import {types} from "mobx-state-tree";

const AddGameViewStore = types
    .model({
        isAddGameFormOpen: true,
        isAddThemeFormOpen: false,
        isAddQuestionFormOpen: false,
        isAddFinalQuestionFormOpen: false
    })
    .actions(self => ({
        toggleAddGameFormOpen() {
            self.isAddGameFormOpen = !self.isAddGameFormOpen;
        },
        toggleAddThemeFormOpen() {
            self.isAddThemeFormOpen = !self.isAddThemeFormOpen;
        },
        toggleAddQuestionFormOpen() {
            self.isAddQuestionFormOpen = !self.isAddQuestionFormOpen;
        },
        toggleAddFinalQuestionFormOpen() {
            self.isAddFinalQuestionFormOpen = !self.isAddFinalQuestionFormOpen;
        },
        clear() {
            self.isAddGameFormOpen = true;
            self.isAddThemeFormOpen = false;
            self.isAddQuestionFormOpen = false;
            self.isAddFinalQuestionFormOpen = false;
        }
    }))

export default AddGameViewStore;