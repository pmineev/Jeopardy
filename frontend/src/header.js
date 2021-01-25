import {Link, NavLink} from "react-router-dom";
import {useAuth} from "./auth";

function Header() {
    const auth = useAuth();
    const username = auth.getUsername();

    return (
        <header className="nav">
            <nav>
                <NavLink to='/games' activeClassName='active'>Игры</NavLink>
                <NavLink to='/lobby' activeClassName='active'>Лобби</NavLink>
            </nav>
            <Link to={`/users/${username}`}>{username}</Link>
        </header>
    );
}

export default Header