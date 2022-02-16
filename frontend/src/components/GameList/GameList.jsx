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
    const {gameListStore: store, gameListViewStore: viewStore} = useStore();

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
                        setSubmitting(false);
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

const GameDescription = observer((props) => {
    const {gameListStore: store, gameListViewStore: viewStore} = useStore();

    return (
        <tr>
            <td>{props.descr.author}</td>
            <td>{props.descr.name}</td>
            <td>{props.descr.roundsCount}</td>
            <td>
                <button
                    onClick={() => {
                        viewStore.toggleCreateGameSessionFormOpen();
                        store.setChosenGame(props.descr);
                    }}
                >
                    Играть
                </button>
            </td>
        </tr>
    );
});

const GameList = observer(() => {
    const navigate = useNavigate();
    const {gameListStore: store, gameListViewStore: viewStore} = useStore();

    useEffect(() => {
        document.title = 'Игры';

        getGameDescriptions()
            .then(result => {
                store.set(result.data);
            })
            .catch(error => {
                console.log(error);
            });
    }, [store])

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
                {values(store.descriptions).map(descr =>
                    <GameDescription
                        key={descr.id}
                        descr={descr}
                    />
                )}
                </tbody>
            </table>

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

export default GameList;