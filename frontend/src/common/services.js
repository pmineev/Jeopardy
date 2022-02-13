import axios from 'axios';
import {toast} from "react-toastify";

const baseURL = 'http://127.0.0.1:8000/api';
const baseStaticURL = 'http://127.0.0.1:8000/static';
axios.defaults.baseURL = baseURL;

axios.interceptors.request.use(
    config => {
        if (!(config.url === '/sessions/'
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

        if (error.response.status === 400) {
            toast.error('Ошибка в формате запроса');
            return Promise.reject(error);
        }

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


export {baseStaticURL};