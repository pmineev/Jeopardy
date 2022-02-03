import axios from "axios";

class GameListService {
    getDescriptions() {
        const url = '/games/';
        return axios.get(url);
    }
}

export {GameListService};