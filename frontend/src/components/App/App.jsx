import React from "react";
import {BrowserRouter, Navigate, Outlet, Route, Routes} from "react-router-dom";

import './App.css'

import PrivateRoute from "../../common/auth/PrivateRoute";
import {isAuthenticated} from "../../common/auth/services";
import Header from "../../common/Header";
import RegisterForm from "../RegisterForm/RegisterForm";
import LoginForm from "../LoginForm/LoginForm";
import UserProfileForm from "../UserProfileForm/UserProfileForm";
import GameList from "../GameList/GameList";
import AddGame from "../AddGame/AddGame";
import Lobby from "../Lobby/Lobby";
import Game from "../Game/Game";
import Toast from "../Toast/Toast";

function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={
                            isAuthenticated()
                                ? <Navigate to="games"/>
                                : <Navigate to="login"/>
                        }
                    />
                    <Route
                        path="/register"
                        element={<RegisterForm/>}
                    />
                    <Route
                        path="/login"
                        element={<LoginForm/>}
                    />
                    <Route
                        element={<AppWrapper/>}
                    >
                        <Route
                            path="/user"
                            element={
                                <PrivateRoute>
                                    <UserProfileForm/>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/games"
                            element={
                                <PrivateRoute>
                                    <GameList/>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/games/new"
                            element={
                                <PrivateRoute>
                                    <AddGame/>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/lobby"
                            element={
                                <PrivateRoute>
                                    <Lobby/>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/game"
                            element={
                                <PrivateRoute>
                                    <Game/>
                                </PrivateRoute>
                            }
                        />
                    </Route>
                </Routes>
            </BrowserRouter>
            <Toast/>
        </>
    );
}


const AppWrapper = () => {
    return (
        <>
            <Header/>
            <Outlet/>
        </>
    );
}

export default App;
