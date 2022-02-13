import axios from "axios";
import {baseStaticURL} from "../../common/services";

const getGameState = () => {
    const url = `game_sessions/current/`;
    return axios.get(url);
};

const createGameSession = (gameName, maxPlayers) => {
    const url = '/game_sessions/';
    console.log('create');
    return axios.post(url, {
        gameName: gameName,
        maxPlayers: maxPlayers
    })
        .catch(({response}) => {
            let errorText;
            if (response?.status < 500) {
                switch (response.data.error) {
                    case 'game_not_found':
                        errorText = 'Игра не найдена';
                        break;
                    case 'already_playing':
                        errorText = 'Вы уже играете';
                        break;
                    default:
                        errorText = 'Ошибка';
                }
            } else
                errorText = 'Ошибка сервера';

            return Promise.reject(errorText);
        });
};

const joinGameSession = (creator) => {
    const url = `game_sessions/actions/join/`;
    axios.post(url, {creator: creator});
};

const leaveGameSession = () => {
    const url = 'game_sessions/current/actions/leave/';
    axios.delete(url);
};

const chooseQuestion = (themeIndex, questionIndex) => {
    const url = 'game_sessions/current/question/';
    axios.post(url, {
        themeIndex: themeIndex,
        questionIndex: questionIndex
    })
        .catch(error => console.log(error));
};

const submitAnswer = (answer) => {
    const url = 'game_sessions/current/answer/';
    axios.post(url, {answer: answer});
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