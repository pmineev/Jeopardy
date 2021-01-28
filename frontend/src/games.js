import {useEffect, useState} from 'react'
import {GameListService} from "./services";
import {useHistory} from "react-router-dom";

const gameListService = new GameListService();



const GameDescription = (props) => {
    const descr = props.descr;

    return (
        <tr>
            <td>{descr.author}</td>
            <td>{descr.name}</td>
            <td>{descr.rounds_count}</td>
            <td>
                <button>Играть</button>
            </td>
        </tr>
    );
};
const GameList = () => {
    const [gameDescriptions, setGameDescriptions] = useState([]);
    const history = useHistory();


    useEffect(() => {
        gameListService.getDescriptions()
            .then(result => {
                setGameDescriptions(result.data)
            });
    }, [])

    return (
        <>
            <header>Игры</header>

            <table className="games-table">
                <thead key="games-table-head">
                <tr>
                    <th>Автор</th>
                    <th>Название</th>
                    <th>Раунды</th>
                </tr>
                </thead>
                <tbody>
                {gameDescriptions.map(descr =>
                    <GameDescription key={descr.name} descr={descr}/>
                )}
                <button onClick={() => history.push('/games/new')}>Создать новую игру</button>
                </tbody>
            </table>

        </>
    );
};

export default GameList;