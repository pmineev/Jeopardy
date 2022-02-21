import axios from "axios";

const postGame = (game) => {
    const url = '/games/';

    return axios.post(url, game);
};

export {postGame};