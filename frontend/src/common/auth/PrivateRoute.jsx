import {Navigate} from "react-router-dom";

import {isAuthenticated} from "./services";

const PrivateRoute = ({children}) => {
    return (
        isAuthenticated()
            ? children
            : <Navigate to="/" replace/>
    );
}

export default PrivateRoute;