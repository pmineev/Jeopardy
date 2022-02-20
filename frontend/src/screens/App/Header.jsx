import {Link} from "react-router-dom";

import {getUsername} from "../../common/auth/services";

function Header() {
    const username = getUsername();

    return (
        <header>
            <nav>
                <Link to='/games'>
                    Игры
                </Link>
                <Link to='/lobby'>
                    Лобби
                </Link>
            </nav>
            <Link to='/user'>
                {username}
            </Link>
        </header>
    );
}

export default Header