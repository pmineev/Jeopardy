import React from "react";
import './App.css'
import {RegisterForm} from "./registration";
import {PrivateRoute, ProvideAuth} from "./auth";
import LoginForm from "./login";
import GamesList from "./games";
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
                    <PrivateRoute path="/games">
                        <GamesList/>
                    </PrivateRoute>
                    <PrivateRoute path="/gameSessions">
                        {/*<GameSessionsList/>*/}
                    </PrivateRoute>
                    <PrivateRoute path="/game">
                        {/*<Game/>*/}
                    </PrivateRoute>
                </Switch>
            </Router>
        </ProvideAuth>
    );
}

export default App;
