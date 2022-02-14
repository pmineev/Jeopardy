import axios from "axios";

const registerUser = (credentials) => {
    const url = '/users/';
    return axios.post(url, {
        username: credentials.username,
        nickname: credentials.nickname,
        password: credentials.password
    })
        .then(response => {
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            setUsername(credentials.username);
            setNickname(credentials.nickname);
        })
        .catch(({response}) => {
            const errorCode = response?.data.error;

            return Promise.reject(errorCode ?? response);
        });
};

const loginUser = (credentials) => {
    const url = '/sessions/';
    return axios
        .post(url, {
            username: credentials.username,
            password: credentials.password
        })
        .then(response => {
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            setNickname(response.data.nickname);
            setUsername(credentials.username);
        })
        .catch(({response}) => {
            const errorCode = response?.data.error;

            return Promise.reject(errorCode ?? response);
        });
};

const isAuthenticated = () => {
    return localStorage.getItem('access_token') !== null;
}

const setUsername = (username) => {
    localStorage.setItem('username', username);
};

const getUsername = () => {
    return localStorage.getItem('username');
};

const setNickname = (nickname) => {
    localStorage.setItem('nickname', nickname);
};

const getNickname = () => {
    return localStorage.getItem('nickname');
};

export {registerUser, loginUser, setUsername, getUsername, setNickname, getNickname, isAuthenticated};