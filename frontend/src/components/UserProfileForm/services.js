import axios from "axios";

const getUser = (username) => {
    const url = `/users/${username}/`;
    return axios.get(url);
};

const saveUser = (username, nickname, password) => {
    const url = `/users/${username}/`;

    let data = {};
    if (nickname && nickname.length > 0)
        data.nickname = nickname
    if (password && password.length > 0)
        data.password = password

    return axios.patch(url, data)
        .catch(({response}) => {
            const errorCode = response?.data.error;
            let errorText;

            switch (errorCode) {
                case 'nickname_already_exists':
                    errorText = 'Ник занят';
                    break;
                default:
                    errorText = 'Ошибка';
            }

            return Promise.reject(errorText);
        });
};

export {getUser, saveUser};