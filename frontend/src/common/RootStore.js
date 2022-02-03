import {createContext, useContext} from "react";
import {types} from "mobx-state-tree";

import GameSessionDescriptionStore from "../components/Lobby/GameSessionDescriptionStore";
import GameListStore from "../components/GameList/GameListStore";
import GameListViewStore from "../components/GameList/GameListViewStore";
import AddGameStore from "../components/AddGame/AddGameStore";
import AddGameViewStore from "../components/AddGame/AddGameViewStore";
import GameSessionStore from "../components/Game/GameSessionStore";

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

