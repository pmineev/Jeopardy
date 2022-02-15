import React, {Fragment} from "react";
import {BrowserRouter as Router, Redirect, Route, Switch} from "react-router-dom";

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
            <Router>
                <Switch>
                    <Route exact path="/">
                        {isAuthenticated() ? <Redirect to="/games"/> : <Redirect to="/login"/>}
                    </Route>
                    <Route path="/register">
                        <RegisterForm/>
                    </Route>
                    <Route path="/login">
                        <LoginForm/>
                    </Route>
                    <Fragment>
                        <Header/>
                        <PrivateRoute exact path="/user">
                            <UserProfileForm/>
                        </PrivateRoute>
                        <PrivateRoute exact path="/games">
                            <GameList/>
                        </PrivateRoute>
                        <PrivateRoute exact path="/games/new">
                            <AddGame/>
                        </PrivateRoute>
                        <PrivateRoute path="/lobby">
                            <Lobby/>
                        </PrivateRoute>
                        <PrivateRoute path="/game">
                            <Game/>
                        </PrivateRoute>
                    </Fragment>
                </Switch>
            </Router>
            <Toast/>
        </>

    );
}

export default App;
