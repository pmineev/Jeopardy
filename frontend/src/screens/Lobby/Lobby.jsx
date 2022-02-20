import {useEffect} from 'react';
import {useNavigate} from "react-router-dom";
import {values} from 'mobx';
import {observer} from "mobx-react-lite";
import {toast} from "react-toastify";

import {Listener, listenerUrls} from "../../common/listener";
import {useStore} from "../../common/RootStore";
import {joinGameSession} from "../Game/services";
import {getGameSessionDescriptions} from "./services";

const GameSessionDescription = observer(({description, navigate}) => {
    return (
        <tr>
            <td>{description.creator}</td>
            <td>{description.gameName}</td>
            <td>{description.currentPlayers}/{description.maxPlayers}</td>
            <td>
                <button
                    onClick={() => {
                        joinGameSession(description.creator)
                            .then(() => {
                                navigate('/game');
                            })
                            .catch(errorCode => {
                                switch (errorCode) {
                                    case 'already_playing':
                                        toast('Вы уже играете');
                                        break;
                                    case 'too_many_players':
                                        toast('Эта игра уже началась');
                                        break;
                                    case 'game_session_not_found':
                                        toast.error('Игра не найдена');
                                        break;
                                    default:
                                        console.log(errorCode);
                                }
                            });
                    }}
                >
                    Играть
                </button>
            </td>
        </tr>
    );
});

const GameSessionsTable = observer(() => {
    const navigate = useNavigate();
    const {lobbyStore: store} = useStore();

    useEffect(() => {
        document.title = 'Лобби'

        const listener = new Listener(listenerUrls.lobby);
        listener.setHandler(store.eventHandler);

        getGameSessionDescriptions()
            .then(result => {
                store.initialize(result.data);
            })
            .catch(error => {
                console.log(error);
            });

        return () => listener.close()
    }, []);

    return (
        <table>
            <thead>
            <tr>
                <th>Создатель</th>
                <th>Название</th>
                <th>Игроки</th>
                <th>Играть</th>
            </tr>
            </thead>
            <tbody>
            {store.descriptions.size > 0 && values(store.descriptions).map(description =>
                <GameSessionDescription
                    key={description.creator}
                    description={description}
                    navigate={navigate}
                />
            )}
            </tbody>
        </table>
    )
});

const Lobby = observer(() => {
    document.title = 'Лобби';

    return (
        <div className='lobby'>
            <h1>Лобби</h1>

            <GameSessionsTable/>
        </div>
    );
});

export default Lobby;