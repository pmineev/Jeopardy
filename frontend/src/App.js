import React from "react";
import './App.css'
import RegisterForm from "./registration";
import LoginForm from "./login";
import {BrowserRouter as Router, Redirect, Route, Switch} from "react-router-dom";

function App() {
    return (
        <Router>
            <Switch>
                <Route path="/register">
                    <RegisterForm/>
                </Route>
                <Route path="/login">
                    <LoginForm/>
                </Route>
                <Route path="/games">
                    {/*<GamesList/>*/}
                </Route>
                <Route path="/gameSessions">
                    {/*<GameSessionsList/>*/}
                </Route>
                <Route path="/game">
                    {/*<Game/>*/}
                </Route>
            </Switch>
        </Router>
    );
}

export default App;
