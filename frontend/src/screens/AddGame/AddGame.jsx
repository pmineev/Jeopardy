import {useEffect} from "react";
import {useNavigate} from 'react-router-dom';
import {Form, Formik} from "formik";
import * as Yup from "yup";
import {observer} from "mobx-react-lite";
import {toast} from "react-toastify";

import {toOrdinal} from "../../common/utils";
import useStore from "../../common/RootStore";
import SubmitError from "../../common/forms/SubmitError";
import TextInput from "../../common/forms/TextInput";
import Modal from "../Modal/Modal";
import {postGame} from "./services";

const AddGameForm = observer(() => {
    const {addGameStore: store, addGameViewStore: viewStore} = useStore();

    return (
            <Formik
                initialValues={{
                    name: '',
                    roundsCount: '3',
                    questionsCount: '5',
                }}
                validationSchema={Yup.object({
                    name: Yup.string()
                        .matches(/\S/, 'Тут же пусто')
                        .required('Обязательное поле'),
                    roundsCount: Yup.number()
                        .required('Обязательное поле')
                        .min(2, 'Не менее 2 раундов')
                        .max(10, 'Не более 10 раундов')
                        .typeError('Введите число')
                        .integer('Так тоже не прокатит'),
                    questionsCount: Yup.number()
                        .required('Обязательное поле')
                        .min(1, 'Не менее 1 вопроса')
                        .max(10, 'Не более 10 вепросов')
                        .typeError('Введите число')
                        .integer('Так тоже не прокатит')
                })}
                onSubmit={({name, roundsCount, questionsCount}, {setSubmitting}) => {
                    setSubmitting(false);
                    store.setGameParams(
                        name,
                        Number(roundsCount),
                        Number(questionsCount)
                    );
                    viewStore.toggleAddGameFormOpen();
                }}
            >
                <Form>
                    <h1>Новая игра</h1>
                    <TextInput
                        label="Название"
                        name="name"
                        type="text"
                    />
                    <TextInput
                        label="Количество раундов"
                        name="roundsCount"
                        type="text"
                    />
                    <TextInput
                        label="Количество вопросов в теме"
                        name="questionsCount"
                        type="text"
                    />

                    <button type="submit">Создать игру</button>
                </Form>
            </Formik>
    );
});

const AddThemeForm = observer(() => {
    const {addGameStore: store, addGameViewStore: viewStore} = useStore();
    return (
        <Formik
            initialValues={{
                name: ''
            }}
            validationSchema={Yup.object({
                name: Yup.string()
                    .matches(/\S/, 'Тут же пусто')
                    .required('Обязательное поле')
                    .max(20, 'Не более 20 символов')
            })}
            onSubmit={({name}, {setSubmitting}) => {
                setSubmitting(false);
                viewStore.toggleAddThemeFormOpen();
                store.selectedRound.addTheme(name);
            }}
        >
            <Form>
                <h1>Новая тема</h1>
                <TextInput
                    label="Название"
                    name="name"
                    type="text"
                />

                <button type="submit">Создать тему</button>
            </Form>
        </Formik>
    );
});

const ChangeGameNameForm = observer(() => {
    const {addGameStore: store, addGameViewStore: viewStore} = useStore();
    return (
        <Formik
            initialValues={{
                name: store.name
            }}
            validationSchema={Yup.object({
                name: Yup.string()
                    .matches(/\S/, 'Тут же пусто')
                    .required('Обязательное поле')
            })}
            onSubmit={({name}, {setSubmitting}) => {
                setSubmitting(false);
                viewStore.toggleChangeGameNameFormOpen();
                store.setGameName(name);
            }}
        >
            <Form>
                <h1>Изменить название игры</h1>
                <TextInput
                    label="Название"
                    name="name"
                    type="text"
                />

                <button type="submit">Сохранить</button>
            </Form>
        </Formik>
    );
});

const Question = observer(({question}) => {
    const {addGameStore: store, addGameViewStore: viewStore} = useStore();

    return (
        <td
            className={question.isSet ? undefined : 'empty'}
            onClick={() => {
                store.setSelectedQuestion(question);
                viewStore.toggleAddQuestionFormOpen();
            }}
        >
            {question.value}
        </td>

    )
});

const Theme = ({theme}) => {
    return (
        <tr>
            <th>
                {theme.name}
            </th>
            {theme.questions.map(question => (
                <Question
                    key={theme.name + question.value.toString()}
                    question={question}
                />
            ))}
        </tr>
    )
}

const AddQuestionForm = observer(() => {
    const {addGameStore: store, addGameViewStore: viewStore} = useStore();

    return (
        <Formik
            initialValues={{
                text: store.selectedQuestion.text ?? '',
                answer: store.selectedQuestion.answer ?? '',
            }}
            validationSchema={Yup.object({
                text: Yup.string()
                    .matches(/\S/, 'Тут же пусто')
                    .required('Обязательное поле')
                    .max(200, 'Не более 200 символов'),
                answer: Yup.string()
                    .matches(/\S/, 'Тут же пусто')
                    .required('Обязательное поле')
                    .max(50, 'Не более 50 символов')
            })}
            onSubmit={({text, answer}, {setSubmitting}) => {
                setSubmitting(false);
                viewStore.toggleAddQuestionFormOpen();
                store.selectedQuestion.set(text, answer);
            }}
        >
            <Form>
                <h1>Вопрос за {store.selectedQuestion.value}</h1>
                <TextInput
                    label="Текст вопроса"
                    name="text"
                    type="text"
                />
                <TextInput
                    label="Ответ"
                    name="answer"
                    type="text"
                />

                <button type="submit">Сохранить</button>
            </Form>
        </Formik>
    );
});

const AddFinalQuestionForm = observer(({navigate}) => {
    const {addGameStore: store} = useStore();

    return (
        <Formik
            initialValues={{
                text: store.finalRound.text ?? '',
                answer: store.finalRound.answer ?? ''
            }}
            validationSchema={Yup.object({
                text: Yup.string()
                    .matches(/\S/, 'Тут же пусто')
                    .required('Обязательное поле')
                    .max(200, 'Не более 200 символов'),
                answer: Yup.string()
                    .matches(/\S/, 'Тут же пусто')
                    .required('Обязательное поле')
                    .max(50, 'Не более 50 символов')
            })}
            onSubmit={({text, answer}, {setSubmitting, setErrors}) => {
                store.setFinalRound(text, answer);
                if (store.isAllRoundsFilled)
                    if (store.isAllQuestionsFilled) {
                        postGame(store.game)
                            .then(() => {
                                setSubmitting(false);
                                toast.success('Игра сохранена!')
                                navigate('/games');
                            })
                            .catch(errorCode => {
                                switch (errorCode) {
                                    case 'game_already_exists':
                                        setErrors({'submitError': 'Игра с таким именем уже существует'});
                                        break;
                                    default:
                                        console.log(errorCode);
                                }
                            });
                    } else
                        setErrors({'submitError': 'Заполните все вопросы'})
                else
                    setErrors({'submitError': 'В каждом раунде должны быть темы'})

            }}
        >
            <Form>
                <h1>Финальный вопрос</h1>
                <TextInput
                    label="Текст вопроса"
                    name="text"
                    type="text"
                />
                <TextInput
                    label="Ответ"
                    name="answer"
                    type="text"
                />

                <SubmitError name='submitError'/>

                <button type="submit">Сохранить игру</button>
            </Form>
        </Formik>
    );
});

const Round = observer(({round}) => {
    const {addGameStore: store, addGameViewStore: viewStore} = useStore();

    return (
        <>
            <h1>{toOrdinal(round.index + 1)} раунд</h1>

            <table>
                <tbody>
                {round.themes && round.themes.map(theme =>
                    <Theme key={theme.name}
                           theme={theme}
                    />
                )}
                </tbody>
            </table>

            <button onClick={viewStore.toggleAddThemeFormOpen}>Добавить тему</button>

            <div className='button-group'>
                <button className={round.index === 0 ? 'hidden' : undefined}
                        onClick={store.previousRound}
                >
                    Предыдущий раунд
                </button>

                <button onClick={() => {
                    if (round.index < store.roundsCount - 2)
                        store.nextRound()
                    else
                        viewStore.toggleAddFinalQuestionFormOpen()
                }}
                >
                    Следующий раунд
                </button>

            </div>

            <button onClick={viewStore.toggleChangeGameNameFormOpen}>Изменить название игры</button>
        </>
    );
});

const RoundsView = observer(() => {
    const navigate = useNavigate();
    const {addGameStore: store, addGameViewStore: viewStore} = useStore();

    return (
        <>
            <Round round={store.selectedRound}/>

            <Modal
                isOpen={viewStore.isAddThemeFormOpen}
                onRequestClose={viewStore.toggleAddThemeFormOpen}
            >
                <AddThemeForm/>
            </Modal>

            <Modal
                isOpen={viewStore.isAddQuestionFormOpen}
                onRequestClose={viewStore.toggleAddQuestionFormOpen}
            >
                <AddQuestionForm/>
            </Modal>

            <Modal
                isOpen={viewStore.isAddFinalQuestionFormOpen}
                onRequestClose={viewStore.toggleAddFinalQuestionFormOpen}
            >
                <AddFinalQuestionForm
                    navigate={navigate}
                />
            </Modal>

            <Modal
                isOpen={viewStore.isChangeGameNameFormOpen}
                onRequestClose={viewStore.toggleChangeGameNameFormOpen}
            >
                <ChangeGameNameForm/>
            </Modal>
        </>
    );
});

const AddGame = observer(() => {
    const {addGameStore: store, addGameViewStore: viewStore} = useStore();

    document.title = 'Добавление игры';

    useEffect(() => {
        return () => {
            store.clear();
            viewStore.clear();
        }
    }, [store, viewStore]);

    return (
        <div className={'add-game' + (viewStore.isAddGameFormOpen ? ' form' : '')}>
            {viewStore.isAddGameFormOpen
                ? <AddGameForm/>
                : <RoundsView/>
            }
        </div>
    )

});

export default AddGame;