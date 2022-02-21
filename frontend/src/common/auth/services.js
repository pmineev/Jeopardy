import axios from "axios";

const registerUser = (username, nickname, password) => {
    const url = '/users/';
    return axios.post(url, {username, nickname, password})
        .then(response => {
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            setUsername(username);
            setNickname(nickname);
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