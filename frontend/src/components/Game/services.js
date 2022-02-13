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
            const errorCode = response?.data.error;
            let errorText;

            switch (errorCode) {
                case 'game_not_found':
                    errorText = 'Игра не найдена';
                    break;
                case 'already_playing':
                    errorText = 'Вы уже играете';
                    break;
                default:
                    errorText = 'Ошибка';
            }

            return Promise.reject(errorText);
        });
};

const joinGameSession = (creator) => {
    const url = `game_sessions/actions/join/`;
    return axios.post(url, {creator: creator})
        .catch(({response}) => {
            const errorCode = response?.data.error;
            let errorText;

            switch (errorCode) {
                case 'game_session_not_found':
                    errorText = 'Игра не найдена';
                    break;
                case 'already_playing':
                    errorText = 'Вы уже играете';
                    break;
                case 'too_many_players':
                    errorText = 'Эта игра уже началась';
                    break;
                default:
                    errorText = 'Ошибка';
            }

            return Promise.reject(errorText);
        });
};

const leaveGameSession = () => {
    const url = 'game_sessions/current/actions/leave/';
    return axios.delete(url)
        .catch(({response}) => {
            const errorCode = response?.data.error;
            let errorText;

            switch (errorCode) {
                case 'game_session_not_found':
                    errorText = 'Игра не найдена';
                    break;
                default:
                    errorText = 'Ошибка';
            }

            return Promise.reject(errorText);
        });
};

const chooseQuestion = (themeIndex, questionIndex) => {
    const url = 'game_sessions/current/question/';
    return axios.post(url, {
        themeIndex: themeIndex,
        questionIndex: questionIndex
    })
        .catch(({response}) => {
            const errorCode = response?.data.error;
            let errorText;

            switch (errorCode) {
                case 'game_session_not_found':
                    errorText = 'Игра не найдена';
                    break;
                case 'wrong_question_request':
                    errorText = 'Некорректный запрос';
                    break;
                case 'not_current_player':
                    errorText = 'Сейчас выбираете не вы';
                    break;
                case 'wrong_stage':
                    errorText = 'Сейчас нельзя выбирать вопрос';
                    break;
                default:
                    errorText = 'Ошибка';
            }

            return Promise.reject(errorText);
        });
};

const submitAnswer = (answer) => {
    const url = 'game_sessions/current/answer/';
    return axios.post(url, {answer: answer})
        .catch(({response}) => {
            const errorCode = response?.data.error;
            let errorText;

            switch (errorCode) {
                case 'game_session_not_found':
                    errorText = 'Игра не найдена';
                    break;
                case 'wrong_stage':
                    errorText = 'Сейчас нельзя отправлять ответ';
                    break;
                default:
                    errorText = 'Ошибка';
            }

            return Promise.reject(errorText);
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