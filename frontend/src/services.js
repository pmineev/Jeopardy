import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:8000';

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
        if (error.response.status !== 401) {
            return Promise.reject(error);
        }

        const refresh_token = localStorage.getItem('refresh_token');
        if (refresh_token) {
            axios.post('/sessions/new_token/', {
                refresh: refresh_token
            })
                .then(response => {
                    localStorage.setItem('access_token', response.data.access)
                });
            return axios.request(error.config);
        } else {

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
    post(game_name, themes, questions) {
        const url = '/games/';

        let game = {};

        game.name = game_name;

        const final_round_question = questions.filter(q => q.theme === 'final')[0];
        game.final_round = {
            text: final_round_question.text,
            answer: final_round_question.answer,
            value: final_round_question.value
        }

        game.rounds = []
        for (let r = 1; r < themes.length; r++) {
            let round = {};

            round.themes = []
            for (let t of themes[r]) {
                let theme = {};

                theme.name = t.name;

                theme.questions = questions
                    .filter(q =>
                        q.round === r
                        && q.theme === theme.name
                    )
                    .sort((q1, q2) =>
                        q1.value - q2.value
                    )

                for (let q of theme.questions) {
                    delete q.theme;
                    delete q.round;
                }

                round.themes.push(theme);
            }

            game.rounds.push(round);
        }
        console.log(game)

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

export {AuthService, GameListService, LobbyService, AddGameService, UserProfileService};