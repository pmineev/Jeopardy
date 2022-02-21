import axios from "axios";
import {baseStaticURL} from "../../common/services";

const getGameState = () => {
    const url = `game_sessions/current/`;
    return axios.get(url);
};

const createGameSession = (gameName, maxPlayers) => {
    const url = '/game_sessions/';
    console.log('create');
    return axios.post(url, {gameName, maxPlayers});
};

const joinGameSession = (creator) => {
    const url = `game_sessions/actions/join/`;
    return axios.post(url, {creator});
};

const leaveGameSession = () => {
    const url = 'game_sessions/current/actions/leave/';
    return axios.delete(url);
};

const chooseQuestion = (themeIndex, questionIndex) => {
    const url = 'game_sessions/current/question/';
    return axios.post(url, {themeIndex, questionIndex});
};

const submitAnswer = (answer) => {
    const url = 'game_sessions/current/answer/';
    return axios.post(url, {answer});
};

const getHostImageUrl = (state) => {
    return baseStaticURL + '/img/kuleshov/' + state + '.jpg';
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