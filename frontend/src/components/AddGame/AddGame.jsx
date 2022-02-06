import {useEffect} from "react";
import {useHistory} from 'react-router-dom';
import {Form, Formik} from "formik";
import * as Yup from "yup";
import Modal from "react-modal";
import {observer} from "mobx-react-lite";
import {getSnapshot} from "mobx-state-tree";

import '../../common/round.css';

import {toOrdinal} from "../../common/utils";
import {useStore} from "../../common/RootStore";
import SubmitError from "../../common/forms/SubmitError";
import TextInput from "../../common/forms/TextInput";
import {postGame} from "./services";

const AddGameForm = observer(() => {
    const {addGameStore: store, addGameViewStore: viewStore} = useStore();

    return (
        <div className='form'>
            <Formik
                initialValues={{
                    name: '',
                    roundsCount: '3',
                    questionsCount: '5',
                }}
                validationSchema={Yup.object({
                    name: Yup.string()
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
                onSubmit={(values, {setSubmitting}) => {
                    setSubmitting(false);
                    store.setGameParams(
                        values.name,
                        Number(values.roundsCount),
                        Number(values.questionsCount)
                    );
                    viewStore.toggleAddGameFormOpen();
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
        </div>
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
                    .required('Обязательное поле')
                    .max(20, 'Не более 20 символов')
            })}
            onSubmit={(values, {setSubmitting}) => {
                setSubmitting(false);
                viewStore.toggleAddThemeFormOpen();
                store.selectedRound.addTheme(values.name);
            }}
        >
            <Form>
                <header>Новая тема</header>
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

const Question = observer(({question}) => {
    const {addGameStore: store, addGameViewStore: viewStore} = useStore();

    return (
        <td
            className={`question-cell ${question.isSet ? '' : 'empty'}`}
            onClick={() => {
                store.setSelectedQuestion(question);
                viewStore.toggleAddQuestionFormOpen();
            }}
        >{question.value}</td>

    )
});

const Theme = ({theme}) => {
    return (
        <tr>
            <td
                key={theme.name}
                className='theme-name'
            >
                {theme.name}
            </td>
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
                    .required('Обязательное поле')
                    .max(200, 'Не более 200 символов'),
                answer: Yup.string()
                    .required('Обязательное поле')
                    .max(50, 'Не более 50 символов')
            })}
            onSubmit={(values, {setSubmitting}) => {
                setSubmitting(false);
                viewStore.toggleAddQuestionFormOpen();
                store.selectedQuestion.set(values.text, values.answer);
            }}
        >
            <Form>
                <header>Вопрос за {store.selectedQuestion.value}</header>
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

const AddFinalQuestionForm = observer(({history}) => {
    const {addGameStore: store} = useStore();

    return (
        <Formik
            initialValues={{
                text: store.finalRound.text ?? '',
                answer: store.finalRound.answer ?? ''
            }}
            validationSchema={Yup.object({
                text: Yup.string()
                    .required('Обязательное поле')
                    .max(200, 'Не более 200 символов'),
                answer: Yup.string()
                    .required('Обязательное поле')
                    .max(50, 'Не более 50 символов')
            })}
            onSubmit={(values, {setSubmitting, setErrors}) => {
                store.setFinalRound(values.text, values.answer);
                if (store.isAllRoundsFilled)
                    if (store.isAllQuestionsFilled) {
                        let storeSnapshot = getSnapshot(store);
                        postGame({
                            name: storeSnapshot.name,
                            rounds: storeSnapshot.rounds.map(round => ({
                                themes: round.themes.map(theme => ({
                                    name: theme.name,
                                    questions: theme.questions.map(({id, ...rest}) => rest)
                                }))
                            })),
                            finalRound: {
                                value: storeSnapshot.finalRound.value,
                                text: storeSnapshot.finalRound.text,
                                answer: storeSnapshot.finalRound.answer
                            }
                        })
                            .then(() => {
                                setSubmitting(false);
                                history.push('/games');
                            })
                            .catch(error =>
                                setErrors({'submitError': error.message})
                            );
                    } else
                        setErrors({'submitError': 'Заполните все вопросы'})
                else
                    setErrors({'submitError': 'В каждом раунде должны быть темы'})

            }}
        >
            <Form>
                <header>Финальный вопрос</header>
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
            <header>{toOrdinal(round.index + 1)} раунд</header>

            <table className="round add-game-table">
                <tbody>
                {round.themes && round.themes.map(theme =>
                    <Theme key={theme.name}
                           theme={theme}
                    />
                )}
                </tbody>
            </table>
            <div className='button-group'>
                <button onClick={viewStore.toggleAddThemeFormOpen}>Добавить тему</button>
            </div>

            <div className='button-group'>
                <button disabled={round.index === 0}
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
        </>
    );
});

const RoundsView = observer(() => {
    const history = useHistory();
    const {addGameStore: store, addGameViewStore: viewStore} = useStore();

    return (
        <>
            <Round round={store.selectedRound}/>

            <Modal
                className='modal form add-theme'
                overlayClassName='overlay'
                isOpen={viewStore.isAddThemeFormOpen}
                onRequestClose={viewStore.toggleAddThemeFormOpen}
                ariaHideApp={false}
            >
                <AddThemeForm/>
            </Modal>

            <Modal
                className='modal form add-question'
                overlayClassName='overlay'
                isOpen={viewStore.isAddQuestionFormOpen}
                onRequestClose={viewStore.toggleAddQuestionFormOpen}
                ariaHideApp={false}
            >
                <AddQuestionForm/>
            </Modal>


            <Modal
                className='modal form add-final-question'
                overlayClassName='overlay'
                isOpen={viewStore.isAddFinalQuestionFormOpen}
                onRequestClose={viewStore.toggleAddFinalQuestionFormOpen}
                ariaHideApp={false}
            >
                <AddFinalQuestionForm
                    history={history}
                />
            </Modal>
        </>
    );
});

const AddGame = observer(() => {
    const {addGameStore: store, addGameViewStore: viewStore} = useStore();

    useEffect(() => {
        document.title = 'Добавление игры'

        return () => {
            store.clear();
            viewStore.clear();
        }
    }, [store, viewStore]);

    return (
        <div className='add-game'>
            {viewStore.isAddGameFormOpen
                ? <AddGameForm/>
                : <RoundsView/>
            }
        </div>
    )

});

export default AddGame;