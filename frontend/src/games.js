import './list.css';
import {useEffect, useState} from 'react'
import {GameListService, GameSessionService} from "./services";
import {useHistory} from "react-router-dom";
import {Form, Formik} from "formik";
import * as Yup from "yup";
import {TextInput} from "./inputs";
import Modal from "react-modal";

const gameListService = new GameListService();
const gameSessionService = new GameSessionService();

const CreateGameSessionForm = (props) => {
    return (
        <Formik
            initialValues={{
                max_players: '2'
            }}
            validationSchema={Yup.object({
                max_players: Yup.number()
                    .required('Обязательное поле')
                    .min(2, 'Не менее 2 игроков')
                    .max(10, 'Не более 10 игроков')
            })}
            onSubmit={(values, {setSubmitting}) => {
                gameSessionService.create(props.gameName, values.max_players)
                    .then((response) => {
                        setSubmitting(false);
                        props.history.push('/game', response.data)
                    })
            }}
        >
            <Form>
                <header>Новая игра</header>
                <TextInput
                    label="Количество игроков"
                    name="max_players"
                    type="text"
                />

                <button type="submit">Начать игру</button>
            </Form>
        </Formik>
    );
}

const GameDescription = (props) => {
    const descr = props.descr;

    return (
        <tr>
            <td>{descr.author}</td>
            <td>{descr.name}</td>
            <td>{descr.rounds_count}</td>
            <td>
                <button
                    onClick={() => props.createGameSession(descr.name)}
                >
                    Играть
                </button>
            </td>
        </tr>
    );
};
const GameList = () => {
    const [gameDescriptions, setGameDescriptions] = useState([]);
    const [isCreateGameSessionFormOpen, setIsCreateGameSessionFormOpen] = useState(false);
    const [chosenGame, setChosenGame] = useState(0);
    const history = useHistory();


    useEffect(() => {
        gameListService.getDescriptions()
            .then(result => {
                setGameDescriptions(result.data)
            });
    }, [])

    return (
        <div className='games'>
            <header>Игры</header>

            <table className="list games-table">
                <thead key="games-table-head">
                <tr>
                    <th>Автор</th>
                    <th>Название</th>
                    <th>Раунды</th>
                </tr>
                </thead>
                <tbody>
                {gameDescriptions.map(descr =>
                    <GameDescription
                        key={descr.name}
                        descr={descr}
                        createGameSession={(gameName) => {
                            setChosenGame(gameName);
                            setIsCreateGameSessionFormOpen(true);
                        }}
                    />
                )}
                </tbody>
            </table>

            <button onClick={() => history.push('/games/new')}>Создать новую игру</button>


            <Modal
                className='modal form create-game-session'
                overlayClassName='overlay'
                isOpen={isCreateGameSessionFormOpen}
                onRequestClose={() => setIsCreateGameSessionFormOpen(false)}
                ariaHideApp={false}
            >
                <CreateGameSessionForm
                    gameName={chosenGame}
                    history={history}
                />
            </Modal>
        </div>
    );
};

export default GameList;