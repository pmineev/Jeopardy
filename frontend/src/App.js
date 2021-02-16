import React, {Fragment} from "react";
import './App.css'
import {RegisterForm} from "./registration";
import {PrivateRoute, useAuth} from "./auth";
import LoginForm from "./login";
import GameList from "./games";
import Header from "./header";
import Lobby from "./lobby";
import AddGame from "./addGame";
import UserProfileForm from "./userProfile";
import Game from "./game";

import {BrowserRouter as Router, Redirect, Route, Switch} from "react-router-dom";

function App() {
    const auth = useAuth();
    return (
        <Router>
            <Switch>
                <Route exact path="/">
                    {auth.isAuthenticated ? <Redirect to="/games"/> : <Redirect to="/login"/>}
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
    );
}

export default App;
