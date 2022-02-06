import {useEffect} from 'react';
import {useHistory} from "react-router-dom";
import {values} from 'mobx';
import {observer} from "mobx-react-lite";

import '../../common/list.css';

import {Listener, listenerUrls} from "../../common/listener";
import {useStore} from "../../common/RootStore";
import {joinGameSession} from "../Game/services";
import {getGameSessionDescriptions} from "./services";

const GameSessionDescriptionView = observer(({descr, history}) => {
    return (
        <tr>
            <td>{descr.creator}</td>
            <td>{descr.gameName}</td>
            <td>{descr.currentPlayers}/{descr.maxPlayers}</td>
            <td>
                <button
                    onClick={() => {
                        joinGameSession(descr.creator);
                        history.push('/game');
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
    const {lobbyStore: store} = useStore();

    useEffect(() => {
        document.title = 'Лобби'

        const listener = new Listener(listenerUrls.lobby);
        listener.setHandler(store.eventHandler);

        getGameSessionDescriptions()
            .then(result => {
                store.initialize(result.data);
            });

        return () => listener.close()
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