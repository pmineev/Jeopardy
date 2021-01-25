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
                })
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


export {AuthService, GameListService, LobbyService};