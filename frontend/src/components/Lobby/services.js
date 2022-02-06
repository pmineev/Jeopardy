import axios from "axios";

const getGameSessionDescriptions = () => {
        const url = '/game_sessions/';
        return axios.get(url);
};

export {getGameSessionDescriptions};