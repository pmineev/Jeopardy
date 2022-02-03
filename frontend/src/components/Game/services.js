import axios from "axios";
import {baseStaticURL} from "../../common/services";

class GameSessionService {
    getGameState() {
        const url = `game_sessions/current/`;
        return axios.get(url);
    }

    create(gameName, maxPlayers) {
        const url = '/game_sessions/';
        console.log('create');
        return axios.post(url, {
            gameName: gameName,
            maxPlayers: maxPlayers
        })
    }

    join(creator) {
        const url = `game_sessions/actions/join/`;
        axios.post(url, {creator: creator});
    }

    leave() {
        const url = 'game_sessions/current/actions/leave/';
        axios.delete(url);
    }

    chooseQuestion(themeIndex, questionIndex) {
        const url = 'game_sessions/current/question/';
        axios.post(url, {
            themeIndex: themeIndex,
            questionIndex: questionIndex
        })
            .catch(error => console.log(error));
    }

    submitAnswer(answer) {
        const url = 'game_sessions/current/answer/';
        axios.post(url, {answer: answer});
    }

    getHostImageUrl(state) {
        const imageURL = baseStaticURL + '/img/kuleshov/' + state + '.jpg';
        return imageURL;
    }

    getAvatarUrl() {
        const imageURL = baseStaticURL + '/img/avatar.png';
        console.log(imageURL);
        return imageURL;
    }
}

export {GameSessionService};