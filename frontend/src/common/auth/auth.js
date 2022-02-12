import React, {createContext, useContext} from "react";
import {Redirect, Route} from "react-router-dom";

import {loginUser, registerUser} from "./services";

const authContext = createContext({});

function useAuth() {
    return useContext(authContext);
}

function useProvideAuth() {

    function setUsername(username) {
        localStorage.setItem('username', username);
    }

    function getUsername() {
        return localStorage.getItem('username');
    }

    function register(credentials) {
        return registerUser(credentials)
            .then(status => {
                if (status < 400) {
                    setUsername(credentials.username);
                    return;
                }

                let message;
                switch (status) {
                    case 409:
                        message = 'Пользователь уже существует';
                        break;

                    case 401:
                        message = 'Неверные данные';
                        break;

                    default:
                        message = 'Ошибка';
                }
                return Promise.reject(new Error(message))

            })
    }

    function login(credentials) {
        return loginUser(credentials)
            .then(status => {
                if (status < 400) {
                    setUsername(credentials.username);
                    return;
                }

                let message;
                switch (status) {
                    case 401:
                        message = 'Неверные данные';
                        break;

                    default:
                        message = 'Ошибка';
                }
                return Promise.reject(new Error(message))

            })
    }

    function isAuthenticated() {
        return localStorage.getItem('access_token') !== null;
    }

    return {
        register,
        login,
        isAuthenticated,
        getUsername
    };
}

function ProvideAuth({children}) {
    const auth = useProvideAuth();
    return (
        <authContext.Provider value={auth}>
            {children}
        </authContext.Provider>
    );
}


function PrivateRoute({children, ...rest}) {
    const auth = useAuth();
    return (
        <Route
            {...rest}
            render={({location}) =>
                auth.isAuthenticated() ? (
                    children
                ) : (
                    <Redirect
                        to={{
                            pathname: "/login",
                            state: {from: location}
                        }}
                    />
                )
            }
        />
    );
}

export {useAuth, ProvideAuth, PrivateRoute};