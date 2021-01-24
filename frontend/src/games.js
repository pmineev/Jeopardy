//import {useState} from 'react'
//import {GameListService} from "./services";

//const gameListService = new GameListService();

const GameDescription = (props) => {
    const descr = props.descr;
    console.log(descr.name);

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
    // const [gameDescriptions, setGameDescriptions] = useState(0);
    // gameListService.getDescriptions()
    //     .then((result) => setGameDescriptions(result))
    const gameDescriptions = [
        {
            "name": "Тестовая",
            "author": "frokouyguyguygfaron",
            "rounds_count": 3
        },
        {
            "name": "Тестовейшая",
            "author": "faron",
            "rounds_count": 2
        }
    ]
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
                </tbody>
            </table>
        </>
    );
};

export default GameList;