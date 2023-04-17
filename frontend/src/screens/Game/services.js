import axios from "axios";
import {baseStaticURL} from "../../common/services";

const getGameState = () => {
    const url = `game_sessions/current/`;
    return axios.get(url);
};

const createGameSession = (gameName, maxPlayers, isHost) => {
    const url = '/game_sessions/';
    return axios.post(url, {gameName, maxPlayers, isHost});
};

const joinGameSession = (creator) => {
    const url = `game_sessions/actions/join/`;
    return axios.post(url, {creator});
};

const leaveGameSession = () => {
    const url = 'game_sessions/current/actions/leave/';
    return axios.delete(url);
};

const startGame = () => {
    const url = 'game_sessions/current/actions/start/';
    return axios.post(url);
};

const chooseQuestion = (themeIndex, questionIndex) => {
    const url = 'game_sessions/current/question/';
    return axios.post(url, {themeIndex, questionIndex});
};

const submitAnswer = (answer) => {
    const url = 'game_sessions/current/answer/';
    return axios.post(url, answer ? {answer} : undefined);
};

const getHostImageUrl = (state) => {
    return baseStaticURL + '/img/kuleshov/' + state + '.jpg';
};

const getAvatarUrl = () => {
    return baseStaticURL + '/img/avatar.png';
};

export {
    getGameState, createGameSession, joinGameSession, leaveGameSession, startGame, chooseQuestion, submitAnswer,
    getHostImageUrl, getAvatarUrl
};