import {createContext, useContext} from "react";
import {types} from "mobx-state-tree";

import GameSessionDescriptionStore from "./GameSessionDescriptionStore";
import GameListStore from "./GameListStore";
import GameListViewStore from "./GameListViewStore";
import AddGameStore from "./AddGameStore";
import AddGameViewStore from "./AddGameViewStore";
import GameSessionStore from "./GameSessionStore";

const RootStore = types
    .model({
        gameSessionDescriptionStore: GameSessionDescriptionStore,
        gameListStore: GameListStore,
        gameListViewStore: GameListViewStore,
        addGameStore: AddGameStore,
        addGameViewStore: AddGameViewStore,
        gameSessionStore: GameSessionStore
    });

let rootStore = RootStore.create({
    gameSessionDescriptionStore: GameSessionDescriptionStore.create(),
    gameListStore: GameListStore.create(),
    gameListViewStore: GameListViewStore.create(),
    addGameStore: AddGameStore.create(),
    addGameViewStore: AddGameViewStore.create(),
    gameSessionStore: GameSessionStore.create()
});

let rootStoreContext = createContext(rootStore);

const RootStoreProvider = rootStoreContext.Provider;

const useStore = () => {
    return useContext(rootStoreContext);
}

export {RootStoreProvider, useStore};

