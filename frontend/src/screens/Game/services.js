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
const allowAnswers = () => {
    const url = 'game_sessions/current/actions/allow_answers/';
    return axios.post(url);
};

const submitAnswer = (answer) => {
    const url = 'game_sessions/current/answer/';
    return axios.post(url, answer ? {answer} : undefined);
};

const confirmAnswer = () => {
    const url = 'game_sessions/current/actions/confirm_answer/';
    return axios.post(url);
};

const rejectAnswer = () => {
    const url = 'game_sessions/current/actions/reject_answer/';
    return axios.post(url);
};

const getHostImageUrl = (stage) => {
    return baseStaticURL + '/img/kuleshov/' + stage + '.jpg';
};

const getAvatarUrl = () => {
    return baseStaticURL + '/img/avatar.png';
};

export {
    getGameState, createGameSession, joinGameSession, leaveGameSession, startGame, chooseQuestion, allowAnswers,
    confirmAnswer, rejectAnswer, submitAnswer, getHostImageUrl, getAvatarUrl
};