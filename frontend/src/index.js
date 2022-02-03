import React from 'react';
import ReactDOM from 'react-dom';

import {ProvideAuth} from "./common/auth/auth";
import App from './components/App/App';

ReactDOM.render(
    <React.StrictMode>
        <ProvideAuth>
            <App/>
        </ProvideAuth>
    </React.StrictMode>,
    document.getElementById('root')
);
