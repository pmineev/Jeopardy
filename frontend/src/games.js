import {useEffect, useState} from 'react'
import {GameListService} from "./services";
import Modal from 'react-modal';
import {Form, Formik} from "formik";
import * as Yup from "yup";
import {TextInput} from "./inputs";

const gameListService = new GameListService();

const AddGameForm = () => {
    return (
        <>
            <Formik
                initialValues={{
                    name: '',
                    rounds_count: '3',
                    questions_count: '5',
                }}
                validationSchema={Yup.object({
                    name: Yup.string()
                        .required('Обязательное поле'),
                    rounds_count: Yup.number()
                        .required('Обязательное поле')
                        .min(2, 'Не менее 2 раундов')
                        .max(10, 'Не более 10 раундов')
                        .typeError('Введите число')
                        .integer('Так тоже не прокатит'),
                    questions_count: Yup.number()
                        .required('Обязательное поле')
                        .min(1, 'Не менее 1 вопроса')
                        .max(10, 'Не более 10 вепросов')
                        .typeError('Введите число')
                        .integer('Так тоже не прокатит')
                })}
                onSubmit={(values, {setSubmitting, setErrors}) => {

                }}
            >
                <Form>
                    <header>Новая игра</header>
                    <TextInput
                        label="Название"
                        name="name"
                        type="text"
                    />
                    <TextInput
                        label="Количество раундов"
                        name="rounds_count"
                        type="text"
                    />
                    <TextInput
                        label="Количество вопросов в теме"
                        name="questions_count"
                        type="text"
                    />

                    <button type="submit">Создать игру</button>
                </Form>
            </Formik>
        </>
    );
};

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
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                <button onClick={() => setIsModalOpen(true)}>Создать новую игру</button>
                </tbody>
            </table>

            <Modal
                className='modal add-game'
                ovrlayClassName='overlay modal add-game'
                isOpen={isModalOpen}
                onRequestClose={() => setIsModalOpen(false)}
                ariaHideApp={false}

            >
                <AddGameForm/>

            </Modal>
        </>
    );
};

export default GameList;