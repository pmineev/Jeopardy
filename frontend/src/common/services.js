import axios from 'axios';
import {toast} from "react-toastify";

const baseURL = 'http://127.0.0.1:8000/api';
const baseStaticURL = 'http://127.0.0.1:8000/static';
axios.defaults.baseURL = baseURL;

axios.interceptors.request.use(
    config => {
        if (!(config.url === '/sessions/'
            || config.url === '/sessions/new_token/'
            || (config.method === 'post' && config.url === '/users/'))) {
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
        if (!error.response) {
            toast.error('Сервер недоступен');
            return Promise.reject('server_down')
        }

        if (error.response.status >= 500) {
            toast.error('Ошибка сервера');
            return Promise.reject('server_error')
        }

        if (error.response.status === 400) {
            toast.error('Ошибка в формате запроса');
            return Promise.reject(error.response.data.code);
        }

        if (error.response.data.code === 'token_not_valid') {
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                return axios.post('/sessions/new_token/', {
                    refresh: refreshToken
                })
                    .then(r => {
                        localStorage.setItem('access_token', r.data.access);
                        return axios.request(error.config);
                    });
            }
        }

        if (error.response.data.code === 'invalid_refresh_token') {
            localStorage.clear();
            toast('Вам необходимо войти');
            return Promise.reject('logout');
        }

        return Promise.reject(error.response?.data?.code ?? 'error');
    }
);


export {baseStaticURL};