import {useEffect, useState} from 'react'
import {LobbyService} from "./services";

const lobbyService = new LobbyService();

const GameSessionDescription = (props) => {
    const descr = props.descr;

    return (
        <tr>
            <td>{descr.creator}</td>
            <td>{descr.game_name}</td>
            <td>{descr.current_players}/{descr.max_players}</td>
            <td>
                <button>Играть</button>
            </td>
        </tr>
    );
};
const Lobby = () => {
    const [gameDescriptions, setGameDescriptions] = useState([]);

    useEffect(() => {
        lobbyService.getDescriptions()
            .then(result => {
                setGameDescriptions(result.data)
            });
    }, [])

    return (
        <>
            <header>Лобби</header>

            <table className="lobby-table">
                <thead key="lobby-table-head">
                <tr>
                    <th>Создатель</th>
                    <th>Название</th>
                    <th>Игроки</th>
                </tr>
                </thead>
                <tbody>
                {gameDescriptions.map(descr =>
                    <GameSessionDescription key={descr.creator} descr={descr}/>
                )}
                </tbody>
            </table>
        </>
    );
};

export default Lobby;