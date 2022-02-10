import axios from "axios";

const postGame = (game) => {
    const url = '/games/';

    return axios.post(url, game)
        .catch(error => {
            if (error.response.status === 409)
                return Promise.reject(new Error('Игра с таким названием уже существует'))
        });
};

export {postGame};