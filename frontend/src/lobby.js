import './list.css';

import {useEffect} from 'react';
import {useHistory} from "react-router-dom";
import {values} from 'mobx';
import {observer} from "mobx-react-lite";

import {GameSessionService, LobbyService} from "./services";
import Notifier from "./notifiers";
import {useStore} from "./stores/RootStore";

const gameSessionService = new GameSessionService();

const GameSessionDescriptionView = observer((props) => {
    const descr = props.descr;
    return (
        <tr>
            <td>{descr.creator}</td>
            <td>{descr.gameName}</td>
            <td>{descr.currentPlayers}/{descr.maxPlayers}</td>
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
});

const Lobby = observer(() => {
    // const [gameDescriptions, dispatch] = useReducer(reducer, []);
    const history = useHistory();
    const {gameSessionDescriptionStore: store} = useStore();

    useEffect(() => {
        document.title = 'Лобби'

        const notifier = new Notifier('lobby');
        notifier.setListener(store.listener);

        const lobbyService = new LobbyService();
        lobbyService.getDescriptions()
            .then(result => {
                store.initialize(result.data);
            });

        return () => notifier.close()
    }, [store]);

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
                {console.log(store.descriptions)}
                {store.descriptions.size > 0 && values(store.descriptions).map(descr =>
                    <GameSessionDescriptionView
                        key={descr.creator}
                        descr={descr}
                        history={history}
                    />
                )}
                </tbody>
            </table>
        </div>
    );
});

export default Lobby;