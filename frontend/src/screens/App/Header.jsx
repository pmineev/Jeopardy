import {Link} from "react-router-dom";

import {getUsername, isAuthenticated} from "../../common/auth/services";

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
            {isAuthenticated()
                ?
                <Link to='/user'
                      className='profile'>
                    {username}
                </Link>
                :
                <Link to='/login'
                      className='profile'>
                    Войти
                </Link>
            }
        </header>
    );
}

export default Header