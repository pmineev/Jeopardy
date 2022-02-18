import {useEffect} from 'react'
import {useNavigate} from "react-router-dom";
import {Form, Formik} from "formik";
import * as Yup from "yup";
import Modal from "react-modal";
import {values} from 'mobx';
import {observer} from "mobx-react-lite";
import {toast} from "react-toastify";

import '../../common/list.css';

import TextInput from "../../common/forms/TextInput";
import {useStore} from "../../common/RootStore";
import {createGameSession} from "../Game/services";
import {getGameDescriptions} from "./services";

const CreateGameSessionForm = observer(({navigate}) => {
    const {gamesStore: store, gamesViewStore: viewStore} = useStore();

    return (
        <Formik
            initialValues={{
                maxPlayers: '2'
            }}
            validationSchema={Yup.object({
                maxPlayers: Yup.number()
                    .required('Обязательное поле')
                    .min(2, 'Не менее 2 игроков')
                    .max(10, 'Не более 10 игроков')
            })}
            onSubmit={(values, {setSubmitting}) => {
                createGameSession(store.chosenGame.name, values.maxPlayers)
                    .then(() => {
                        navigate('/game');
                    })
                    .catch(errorCode => {
                        switch (errorCode) {
                            case 'already_playing':
                                toast('Вы уже играете');
                                break;
                            case 'game_not_found':
                                toast.error('Игра не найдена');
                                break;
                            default:
                                console.log(errorCode);
                        }
                    })
                viewStore.toggleCreateGameSessionFormOpen();
            }}
        >
            <Form>
                <header>Новая игра</header>
                <TextInput
                    label="Количество игроков"
                    name="maxPlayers"
                    type="text"
                />

                <button type="submit">Начать игру</button>
            </Form>
        </Formik>
    );
});

const GameDescription = observer(({description}) => {
    const {gamesStore: store, gamesViewStore: viewStore} = useStore();

    return (
        <tr>
            <td>{description.author}</td>
            <td>{description.name}</td>
            <td>{description.roundsCount}</td>
            <td>
                <button
                    onClick={() => {
                        viewStore.toggleCreateGameSessionFormOpen();
                        store.setChosenGame(description);
                    }}
                >
                    Играть
                </button>
            </td>
        </tr>
    );
});

const GamesTable = observer(() => {
    const {gamesStore: store} = useStore();

    useEffect(() => {
        getGameDescriptions()
            .then(result => {
                store.set(result.data);
            })
            .catch(error => {
                console.log(error);
            });
    }, []);

    return (
        <table className="list games-table">
            <thead key="games-table-head">
            <tr>
                <th>Автор</th>
                <th>Название</th>
                <th>Раунды</th>
            </tr>
            </thead>
            <tbody>
            {store.descriptions.size > 0 && values(store.descriptions).map(description =>
                <GameDescription
                    key={description.name}
                    description={description}
                />
            )}
            </tbody>
        </table>
    )
});

const Games = observer(() => {
    const navigate = useNavigate();
    const {gamesViewStore: viewStore} = useStore();

    document.title = 'Игры';

    return (
        <div className='games'>
            <header>Игры</header>

            <GamesTable/>

            <button onClick={() => navigate('/games/new')}>Создать новую игру</button>


            <Modal
                className='modal form create-game-session'
                overlayClassName='overlay'
                isOpen={viewStore.isCreateGameSessionFormOpen}
                onRequestClose={viewStore.toggleCreateGameSessionFormOpen}
                ariaHideApp={false}
            >
                <CreateGameSessionForm
                    navigate={navigate}
                />
            </Modal>
        </div>
    );
});

export default Games;