import {Link, NavLink} from "react-router-dom";

import './Header.css';

import {getUsername} from "./auth/services";

function Header() {
    const username = getUsername();

    return (
        <header className="nav">
            <nav>
                <NavLink to='/games' activeClassName='active'>Игры</NavLink>
                <NavLink to='/lobby' activeClassName='active'>Лобби</NavLink>
            </nav>
            <Link to='/user'>{username}</Link>
        </header>
    );
}

export default Header