import React, {createContext, useContext, useState} from "react";
import {Redirect, Route} from "react-router-dom";
import {AuthService} from "./services";

const authContext = createContext({});
const authService = new AuthService();

function useAuth() {
    return useContext(authContext);
}

function useProvideAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    function register(credentials) {
        return authService.register(credentials)
            .then(status => {
                if (status < 400) {
                    setIsAuthenticated(true);
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
        return authService.login(credentials)
            .then(status => {
                if (status < 400) {
                    setIsAuthenticated(true);
                    console.log(isAuthenticated + 'auth');
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

    return {
        register,
        login,
        isAuthenticated
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
    console.log(auth.isAuthenticated + 'route');
    return (
        <Route
            {...rest}
            render={({location}) =>
                auth.isAuthenticated ? (
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