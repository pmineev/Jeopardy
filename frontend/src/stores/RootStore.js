import {createContext, useContext} from "react";
import {types} from "mobx-state-tree";

import GameSessionDescriptionStore from "./GameSessionDescriptionStore";
import GameListStore from "./GameListStore";
import GameListViewStore from "./GameListViewStore";

const RootStore = types
    .model({
        gameSessionDescriptionStore: GameSessionDescriptionStore,
        gameListStore: GameListStore,
        gameListViewStore: GameListViewStore
    });

let rootStore = RootStore.create({
    gameSessionDescriptionStore: GameSessionDescriptionStore.create({}),
    gameListStore: GameListStore.create({}),
    gameListViewStore: GameListViewStore.create({isCreateGameSessionFormOpen: false})
});

let rootStoreContext = createContext(rootStore);

const RootStoreProvider = rootStoreContext.Provider;

const useStore = () => {
    return useContext(rootStoreContext);
}

export {RootStoreProvider, useStore};

