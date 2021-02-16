import './list.css';
import {useEffect, useReducer} from 'react';
import {GameSessionService, LobbyService} from "./services";
import Notifier from "./notifiers";
import {useHistory} from "react-router-dom";

const gameSessionService = new GameSessionService();

const GameSessionDescription = (props) => {
    const descr = props.descr;
    return (
        <tr>
            <td>{descr.creator}</td>
            <td>{descr.game_name}</td>
            <td>{descr.current_players}/{descr.max_players}</td>
            <td>
                <button
                    onClick={() => {
                        gameSessionService.join(descr.id)
                            .then(response =>
                                props.history.push('/game', response.data)
                            )
                    }}
                >
                    Играть
                </button>
            </td>
        </tr>
    );
};

function reducer(gameDescriptions, [event, data]) {
    switch (event) {
        case 'init': {
            return data;
        }
        case 'game_session_created': {
            return gameDescriptions.concat(data);
        }
        case 'game_session_deleted': {
            const index = gameDescriptions.findIndex(d => d.id === data.game_session_id);
            return gameDescriptions.slice(0, index - 1)
                .concat(gameDescriptions.slice(index + 1))
        }
        case 'player_joined': {
            const index = gameDescriptions.findIndex(d => d.id === data.game_session_id);
            return gameDescriptions.slice(0, index - 1)
                .concat(
                    {...gameDescriptions[index], current_players: gameDescriptions[index].current_players + 1}
                    , gameDescriptions.slice(index + 1))
        }
        case 'player_left': {
            const index = gameDescriptions.findIndex(d => d.id === data.game_session_id);
            return gameDescriptions.slice(0, index - 1)
                .concat(
                    {...gameDescriptions[index], current_players: gameDescriptions[index].current_players - 1}
                    , gameDescriptions.slice(index + 1))
        }
        default:
            throw new Error('нет такого события')
    }
}

const Lobby = () => {
    const [gameDescriptions, dispatch] = useReducer(reducer, []);
    const history = useHistory();

    useEffect(() => {
        document.title = 'Лобби'

        const notifier = new Notifier('lobby');
        notifier.setListener(dispatch);

        const lobbyService = new LobbyService();
        lobbyService.getDescriptions()
            .then(result => {
                dispatch(['init', result.data]);
            });

        return () => notifier.close()
    }, []);

    return (
        <div className='lobby'>
            <header>Лобби</header>

            <table className="list lobby-table">
                <thead key="lobby-table-head">
                <tr>
                    <th>Создатель</th>
                    <th>Название</th>
                    <th>Игроки</th>
                </tr>
                </thead>
                <tbody>
                {gameDescriptions.length > 0 && gameDescriptions.map(descr =>
                    <GameSessionDescription
                        key={descr.creator}
                        descr={descr}
                        history={history}
                    />
                )}
                </tbody>
            </table>
        </div>
    );
};

export default Lobby;