import {Link, NavLink} from "react-router-dom";

import './Header.css';

import {getUsername} from "./auth/services";

function Header() {
    const username = getUsername();

    return (
        <header className="nav">
            <nav>
                <NavLink
                    to='/games'
                    className={({isActive}) => isActive ? " active" : ""}
                >
                    Игры
                </NavLink>
                <NavLink
                    to='/lobby'
                    className={({isActive}) => isActive ? " active" : ""}
                >
                    Лобби
                </NavLink>
            </nav>
            <Link to='/user'>{username}</Link>
        </header>
    );
}

export default Header