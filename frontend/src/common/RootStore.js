import {createContext, useContext} from "react";
import {types} from "mobx-state-tree";

import LobbyStore from "../screens/Lobby/LobbyStore";
import GamesStore from "../screens/Games/GamesStore";
import GamesViewStore from "../screens/Games/GamesViewStore";
import AddGameStore from "../screens/AddGame/AddGameStore";
import AddGameViewStore from "../screens/AddGame/AddGameViewStore";
import GameStore from "../screens/Game/GameStore";

const RootStore = types
    .model({
        lobbyStore: LobbyStore,
        gamesStore: GamesStore,
        gamesViewStore: GamesViewStore,
        addGameStore: AddGameStore,
        addGameViewStore: AddGameViewStore,
        gameStore: GameStore
    });

let rootStore = RootStore.create({
    lobbyStore: LobbyStore.create(),
    gamesStore: GamesStore.create(),
    gamesViewStore: GamesViewStore.create(),
    addGameStore: AddGameStore.create(),
    addGameViewStore: AddGameViewStore.create(),
    gameStore: GameStore.create()
});

let rootStoreContext = createContext(rootStore);

const useStore = () => {
    return useContext(rootStoreContext);
}

export default useStore;

