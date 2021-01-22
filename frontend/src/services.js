import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

class AuthService {

    register(credentials) {
        const url = `${API_URL}/users/`;
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
        const url = `${API_URL}/sessions/`;
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

export {AuthService};