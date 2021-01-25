import React, {Fragment} from "react";
import './App.css'
import {RegisterForm} from "./registration";
import {PrivateRoute, ProvideAuth} from "./auth";
import LoginForm from "./login";
import GameList from "./games";
import Header from "./header";

import {BrowserRouter as Router, Route, Switch} from "react-router-dom";


function App() {
    return (
        <ProvideAuth>
            <Router>
                <Switch>
                    <Route path="/register">
                        <RegisterForm/>
                    </Route>
                    <Route path="/login">
                        <LoginForm/>
                    </Route>
                    <Fragment>
                        <Header/>
                        <PrivateRoute path="/games">
                            <GameList/>
                        </PrivateRoute>
                        <PrivateRoute path="/gameSessions">
                            {/*<GameSessionsList/>*/}
                        </PrivateRoute>
                        <PrivateRoute path="/game">
                            {/*<Game/>*/}
                        </PrivateRoute>
                    </Fragment>
                </Switch>
            </Router>
        </ProvideAuth>
    );
}

export default App;
