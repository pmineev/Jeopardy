import axios from "axios";
import {baseStaticURL} from "../../common/services";

const getGameState = () => {
    const url = `game_sessions/current/`;
    return axios.get(url)
        .catch(({response}) => {
            const errorCode = response?.data.code;

            return Promise.reject(errorCode ?? response);
        });
};

const createGameSession = (gameName, maxPlayers) => {
    const url = '/game_sessions/';
    console.log('create');
    return axios.post(url, {
        gameName: gameName,
        maxPlayers: maxPlayers
    })
        .catch(({response}) => {
            const errorCode = response?.data.code;

            return Promise.reject(errorCode ?? response);
        });
};

const joinGameSession = (creator) => {
    const url = `game_sessions/actions/join/`;
    return axios.post(url, {creator: creator})
        .catch(({response}) => {
            const errorCode = response?.data.code;

            return Promise.reject(errorCode ?? response);
        });
};

const leaveGameSession = () => {
    const url = 'game_sessions/current/actions/leave/';
    return axios.delete(url)
        .catch(({response}) => {
            const errorCode = response?.data.code;

            return Promise.reject(errorCode ?? response);
        });
};

const chooseQuestion = (themeIndex, questionIndex) => {
    const url = 'game_sessions/current/question/';
    return axios.post(url, {
        themeIndex: themeIndex,
        questionIndex: questionIndex
    })
        .catch(({response}) => {
            const errorCode = response?.data.code;

            return Promise.reject(errorCode ?? response);
        });
};

const submitAnswer = (answer) => {
    const url = 'game_sessions/current/answer/';
    return axios.post(url, {answer: answer})
        .catch(({response}) => {
            const errorCode = response?.data.code;

            return Promise.reject(errorCode ?? response);
        });
};

const getHostImageUrl = (state) => {
    const imageURL = baseStaticURL + '/img/kuleshov/' + state + '.jpg';
    return imageURL;
};

const getAvatarUrl = () => {
    const imageURL = baseStaticURL + '/img/avatar.png';
    console.log(imageURL);
    return imageURL;
};

export {
    getGameState, createGameSession, joinGameSession, leaveGameSession, chooseQuestion, submitAnswer,
    getHostImageUrl, getAvatarUrl
};