import axios from "axios";

const getGameDescriptions = () => {
        const url = '/games/';
        return axios.get(url);
};

export {getGameDescriptions};