import {createContext, useContext} from "react";
import {types} from "mobx-state-tree";

import GameSessionDescriptionStore from "./GameSessionDescriptionStore";

const RootStore = types
    .model({
        gameSessionDescriptionStore: GameSessionDescriptionStore

    });

let rootStore = RootStore.create({
    gameSessionDescriptionStore: GameSessionDescriptionStore.create({})
});

let rootStoreContext = createContext(rootStore);

const RootStoreProvider = rootStoreContext.Provider;

const useStore = () => {
    return useContext(rootStoreContext);
}

export {RootStoreProvider, useStore};

