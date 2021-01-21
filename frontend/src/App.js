import React from 'react';
import './App.css'
import SignupForm from "./registration";
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";

function App() {
    return (
        <Router>
            <Switch>
                <Route path="/register">
                    <SignupForm/>
                </Route>
                <Route path="/login">
                    {/*<LoginForm/>*/}
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
