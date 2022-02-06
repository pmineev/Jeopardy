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
            return response.status;
        })
        .catch(error => {
            return error.response.status;
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
            return response.status;
        })
        .catch(error => {
            return error.response.status;
        });
};

export {registerUser, loginUser};