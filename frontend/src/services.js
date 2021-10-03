import axios from 'axios';

const baseURL = 'http://127.0.0.1:8000/api';
const baseStaticURL = 'http://127.0.0.1:8000/static';
axios.defaults.baseURL = baseURL;

axios.interceptors.request.use(
    config => {
        if (!(config.url === '/sessions/')) {
            const access_token = localStorage.getItem('access_token');
            config.headers['Authorization'] = `Bearer ${access_token}`;
        }

        return config;
    }
);

axios.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        if (error.response.status !== 401
            || error.config.url === '/sessions/') {
            console.log(error);
            return Promise.reject(error);
        }

        if (error.response.data.messages?.[0].token_type !== 'access') {
            localStorage.clear();
            return Promise.reject(error);
        } else {
            const refresh_token = localStorage.getItem('refresh_token');
            if (refresh_token) {
                axios.post('/sessions/new_token/', {
                    refresh: refresh_token
                })
                    .then(response => {
                        localStorage.setItem('access_token', response.data.access)
                    })
                    .catch(error => {
                        console.log(error)
                    });
                return axios.request(error.config);
            } else {

            }
        }

        console.log(error.response);

    }
);


class AuthService {

    register(credentials) {
        const url = '/users/';
        return axios.post(url, {
            username: credentials.username,
            nickname: credentials.nickname,
            password: credentials.password
        })
            .then(response => {
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);
                return response.status;
            })
            .catch(error => {
                return error.response.status;
            });
    }

    login(credentials) {
        const url = '/sessions/';
        return axios
            .post(url, {
                username: credentials.username,
                password: credentials.password
            })
            .then(response => {
                localStorage.setItem('access_token', response.data.access);
                localStorage.setItem('refresh_token', response.data.refresh);
                return response.status;
            })
            .catch(error => {
                return error.response.status;
            });
    }

}

class GameListService {
    getDescriptions() {
        const url = '/games/';
        return axios.get(url);
    }
}

class LobbyService {
    getDescriptions() {
        const url = '/game_sessions/';
        return axios.get(url);
    }
}

class AddGameService {
    post(game) {
        const url = '/games/';

        return axios.post(url, game)
            .catch(error => {
                if (error.response.status === 409)
                    return Promise.reject(new Error('Игра с таким названием уже существует'))
            });
    }
}

class UserProfileService {
    get(username) {
        const url = `/users/${username}/`;
        return axios.get(url);
    }

    save(username, nickname, password) {
        const url = `/users/${username}/`;

        let data = {};
        if (nickname && nickname.length > 0)
            data.nickname = nickname
        if (password && password.length > 0)
            data.password = password

        return axios.patch(url, data);
    }
}

class GameSessionService {
    create(gameName, max_players) {
        const url = '/game_sessions/';
        console.log('create');
        return axios.post(url, {
            game_name: gameName,
            max_players: max_players
        })
    }

    join(game_session_id) {
        const url = `game_sessions/chosen/${game_session_id}/`;
        return axios.post(url);
    }

    leave(game_session_id) {
        const url = `game_sessions/exited/${game_session_id}/`;
        axios.delete(url);
    }

    chooseQuestion(game_session_id, theme_order, question_order) {
        const url = `game_sessions/${game_session_id}/question/`;
        axios.post(url, {
            theme_order: theme_order,
            question_order: question_order
        })
            .catch(error => console.log(error));
    }

    submitAnswer(game_session_id, answer) {
        const url = `game_sessions/${game_session_id}/answer/`;
        axios.post(url, {answer: answer});
    }

    getHostImageUrl(state) {
        const imageURL = baseStaticURL + '/img/kuleshov/' + state + '.jpg';
        console.log(imageURL);
        return imageURL;
    }

    getAvatarUrl() {
        const imageURL = baseStaticURL + '/img/avatar.png';
        console.log(imageURL);
        return imageURL;
    }
}

export {AuthService, GameListService, LobbyService, AddGameService, UserProfileService, GameSessionService};