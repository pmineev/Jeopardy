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
            let errorText;
            if (response?.status < 500) {
                switch (response.data.error) {
                    case 'user_already_exists':
                        errorText = 'Имя пользователя занято';
                        break;
                    case 'nickname_already_exists':
                        errorText = 'Ник занят';
                        break;
                    default:
                        errorText = 'Ошибка';
                }
            } else
                errorText = 'Ошибка сервера';

            return Promise.reject(errorText);
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
            let errorText;
            if (response?.status < 500) {
                switch (response.data.error) {
                    case 'user_not_found':
                        errorText = 'Неверные данные';
                        break;
                    default:
                        errorText = 'Ошибка';
                }
            } else
                errorText = 'Ошибка сервера';

            return Promise.reject(errorText);
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