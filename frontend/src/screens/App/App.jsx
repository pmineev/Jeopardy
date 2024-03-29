import React from "react";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";

import 'react-toastify/dist/ReactToastify.css';
import './App.css'

import PrivateRoute from "../../common/auth/PrivateRoute";
import {isAuthenticated} from "../../common/auth/services";
import Register from "../Register/Register";
import Login from "../Login/Login";
import UserProfile from "../UserProfile/UserProfile";
import Games from "../Games/Games";
import AddGame from "../AddGame/AddGame";
import Lobby from "../Lobby/Lobby";
import Game from "../Game/Game";
import Toast from "./Toast";
import HeaderWrapper from "./HeaderWrapper";

function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route
                        path="/"
                        element={<Navigate to="games"/>}
                    />
                    <Route
                        path="/register"
                        element={<Register/>}
                    />
                    <Route
                        path="/login"
                        element={<Login/>}
                    />
                    <Route
                        path="*"
                        element={<Navigate to="/" replace/>}
                    />
                    <Route
                        element={<HeaderWrapper/>}
                    >
                        <Route
                            path="/user"
                            element={
                                <PrivateRoute>
                                    <UserProfile/>
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/games"
                            element={<Games/>}
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
                            element={<Lobby/>}
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

export default App;
