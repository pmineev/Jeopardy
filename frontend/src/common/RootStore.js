import {createContext, useContext} from "react";
import {types} from "mobx-state-tree";

import LobbyStore from "../screens/Lobby/LobbyStore";
import GameListStore from "../screens/GameList/GameListStore";
import GameListViewStore from "../screens/GameList/GameListViewStore";
import AddGameStore from "../screens/AddGame/AddGameStore";
import AddGameViewStore from "../screens/AddGame/AddGameViewStore";
import GameStore from "../screens/Game/GameStore";

const RootStore = types
    .model({
        lobbyStore: LobbyStore,
        gameListStore: GameListStore,
        gameListViewStore: GameListViewStore,
        addGameStore: AddGameStore,
        addGameViewStore: AddGameViewStore,
        gameStore: GameStore
    });

let rootStore = RootStore.create({
    lobbyStore: LobbyStore.create(),
    gameListStore: GameListStore.create(),
    gameListViewStore: GameListViewStore.create(),
    addGameStore: AddGameStore.create(),
    addGameViewStore: AddGameViewStore.create(),
    gameStore: GameStore.create()
});

let rootStoreContext = createContext(rootStore);

const RootStoreProvider = rootStoreContext.Provider;

const useStore = () => {
    return useContext(rootStoreContext);
}

export {RootStoreProvider, useStore};

