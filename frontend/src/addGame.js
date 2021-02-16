import './round.css';
import {Form, Formik} from "formik";
import * as Yup from "yup";
import {SubmitError, TextInput} from "./inputs";
import {useEffect, useState} from "react";
import Modal from "react-modal";
import {AddGameService} from "./services";
import {useHistory} from 'react-router-dom';
import {toOrdinal} from "./utils";

const addGameService = new AddGameService();

const AddGameForm = (props) => {
    return (
        <div className='form'>
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
                onSubmit={(values, {setSubmitting}) => {
                    setSubmitting(false);
                    props.setGameParams({...values, themes: []});
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
        </div>
    );
};

const AddThemeForm = (props) => {
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
                props.setTheme(values);
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
}

const Question = (props) => {
    return (
        <td
            className={`question-cell ${props.isSet ? '' : 'empty'}`}
            onClick={() => props.setQuestion(props.round, props.theme, props.value)}
        >{props.value}</td>

    )
}

const Theme = (props) => {
    const question_values = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    console.log('theme_q', props.questions);
    console.log('theme_q_filter100', props.questions.filter(q =>
        q.value === (100 * props.round)
    ).length !== 0);
    return (
        <tr>
            <td
                key={props.name}
                className='theme-name'
            >
                {props.name}
            </td>
            {question_values.slice(0, props.questions_count).map(value => (
                <Question
                    key={props.name + value}
                    round={props.round}
                    theme={props.name}
                    value={value * props.round}
                    setQuestion={props.setQuestion}
                    isSet={props.questions.filter(q =>
                        q.value === value * props.round
                    ).length !== 0
                    }
                />
            ))}
        </tr>
    )
}

const AddQuestionForm = (props) => {
    return (
        <Formik
            initialValues={props.initialValues}
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
                props.setQuestion(values);
            }}
        >
            <Form>
                <header>{props.theme} за {props.value}</header>
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
}

const AddFinalQuestionForm = (props) => {
    function isAllRoundsFilled() {
        for (let round = 1; round < props.rounds_count; round++) {
            if (!props.themes[round] || props.themes[round].length === 0)
                return false;
        }
        return true;
    }

    function isAllQuestionsFilled() {
        for (let round = 1; round < props.rounds_count; round++) {
            for (let theme of props.themes[round]) {
                if (props.questions.filter(q =>
                    q.round === round
                    && q.theme === theme.name
                ).length !== Number(props.questions_count))
                    return false;
            }
        }
        return true;
    }

    console.log(props.initialValues);
    return (
        <Formik
            initialValues={props.initialValues
            ?? {
                text: '',
                answer: ''
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
                props.setFinalQuestion(values);
                if (isAllRoundsFilled())
                    if (isAllQuestionsFilled()) {
                        addGameService.post(props.game_name, props.themes, props.questions)
                            .then(response => {
                                setSubmitting(false);
                                localStorage.removeItem('game');
                                props.history.push('/games');
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
}

const SetRounds = (props) => {
    const history = useHistory();
    const [isAddThemeFormOpen, setIsAddThemeFormOpen] = useState(false);
    const [isAddQuestionFormOpen, setIsAddQuestionFormOpen] = useState(false);
    const [isAddFinalQuestionFormOpen, setIsAddFinalQuestionFormOpen] = useState(false);
    const [gameParams, setGameParams] = useState(props.gameParams);
    const [themes, setThemes] = useState(props.gameParams.themes);
    const [currentRound, setCurrentRound] = useState(1);
    const [questions, setQuestions] = useState([]);
    const [questionParams, setQuestionParams] = useState({index: -1});

    useEffect(() => {
        console.log(props.savedGame);
        if (props.savedGame) {
            setIsAddThemeFormOpen(props.savedGame.modals.isAddThemeFormOpen);
            setIsAddQuestionFormOpen(props.savedGame.modals.isAddQuestionFormOpen);
            setIsAddFinalQuestionFormOpen(props.savedGame.modals.isAddFinalQuestionFormOpen);
            setGameParams(props.savedGame.gameParams);
            setThemes(props.savedGame.themes);
            setCurrentRound(props.savedGame.currentRound);
            setQuestions(props.savedGame.questions);
            setQuestionParams(props.savedGame.questionParams);
        }
    }, []);

    useEffect(() => {
        const game = {
            modals: {
                isAddThemeFormOpen: isAddThemeFormOpen,
                isAddQuestionFormOpen: isAddQuestionFormOpen,
                isAddFinalQuestionFormOpen: isAddFinalQuestionFormOpen
            },
            gameParams: gameParams,
            themes: themes,
            currentRound: currentRound,
            questions: questions,
            questionParams: questionParams
        }

        localStorage.setItem('game', JSON.stringify(game));
    }, [
        isAddThemeFormOpen,
        isAddQuestionFormOpen,
        isAddFinalQuestionFormOpen,
        gameParams,
        themes,
        currentRound,
        questions,
        questionParams
    ])

    return (
        <>
            <header>{toOrdinal(currentRound)} раунд</header>

            <table className="round add-game-table">
                <tbody>
                {themes[currentRound] && themes[currentRound].map(theme =>
                    <Theme key={theme.name}
                           name={theme.name}
                           round={currentRound}
                           questions_count={gameParams.questions_count}
                           questions={questions.filter(q =>
                               q.round === currentRound
                               && q.theme === theme.name
                           )}
                           setQuestion={(r, t, v) => {
                               setQuestionParams({
                                   round: r,
                                   theme: t,
                                   value: v,
                                   index: questions.findIndex(q =>
                                       q.round === r
                                       && q.theme === t
                                       && q.value === v)
                               })
                               setIsAddQuestionFormOpen(true);
                           }}
                    />
                )}
                </tbody>
            </table>
            <div className='button-group'>
                <button onClick={() => setIsAddThemeFormOpen(true)}>Добавить тему</button>
            </div>

            <div className='button-group'>
                <button disabled={currentRound === 1}
                        onClick={() => setCurrentRound(currentRound === 'final'
                            ? Number(gameParams.rounds_count) - 1
                            : currentRound - 1)
                        }>Предыдущий раунд
                </button>

                <button onClick={() => {
                    let nextRound = currentRound + 1;
                    console.log('nr', nextRound, gameParams.rounds_count);
                    if (nextRound === Number(gameParams.rounds_count))
                        setIsAddFinalQuestionFormOpen(true)
                    else
                        setCurrentRound(nextRound)
                }

                }>Следующий раунд
                </button>
            </div>

            <Modal
                className='modal form add-theme'
                overlayClassName='overlay'
                isOpen={isAddThemeFormOpen}
                onRequestClose={() => setIsAddThemeFormOpen(false)}
                ariaHideApp={false}
            >
                <AddThemeForm
                    setTheme={(theme) => {
                        if (!themes[currentRound])
                            themes[currentRound] = [];
                        themes[currentRound].push(theme);
                        setIsAddThemeFormOpen(false);
                        setThemes(themes);
                    }}/>
            </Modal>

            <Modal
                className='modal form add-question'
                overlayClassName='overlay'
                isOpen={isAddQuestionFormOpen}
                onRequestClose={() => setIsAddQuestionFormOpen(false)}
                ariaHideApp={false}
            >
                <AddQuestionForm
                    theme={questionParams.theme}
                    value={questionParams.value}
                    setQuestion={question => {
                        if (questionParams.index === -1)
                            questions.push({
                                round: questionParams.round,
                                theme: questionParams.theme,
                                value: questionParams.value,
                                text: question.text,
                                answer: question.answer,
                            })
                        else {
                            questions[questionParams.index].text = question.text;
                            questions[questionParams.index].answer = question.answer;
                        }
                        setQuestions(questions);
                        setIsAddQuestionFormOpen(false);
                    }}
                    initialValues={
                        questionParams.index === -1
                            ? {
                                text: '',
                                answer: ''
                            }
                            : {
                                text: questions[questionParams.index].text,
                                answer: questions[questionParams.index].answer
                            }
                    }
                />
            </Modal>


            <Modal
                className='modal form add-final-question'
                overlayClassName='overlay'
                isOpen={isAddFinalQuestionFormOpen}
                onRequestClose={() => setIsAddFinalQuestionFormOpen(false)}
                ariaHideApp={false}
            >
                <AddFinalQuestionForm
                    game_name={gameParams.name}
                    rounds_count={gameParams.rounds_count}
                    questions_count={gameParams.questions_count}
                    questions={questions}
                    themes={themes}
                    initialValues={questions.filter(q => q.theme === 'final')[0]}
                    history={history}
                    setFinalQuestion={question => {
                        let i = questions.findIndex(q => q.theme === 'final');
                        let newQuestion = {
                            theme: 'final',
                            value: 200 * gameParams.rounds_count * gameParams.questions_count,
                            ...question
                        }
                        if (i === -1)
                            questions.push(newQuestion)
                        else
                            questions[i] = newQuestion;
                        setQuestions(questions);
                    }}
                />
            </Modal>
        </>
    );
}

const AddGame = () => {
    const [gameParams, setGameParams] = useState(undefined);
    const [savedGame, setSavedGame] = useState(undefined);

    useEffect(() => {
        document.title = 'Добавление игры'
        setSavedGame(JSON.parse(localStorage.getItem('game')));
    }, []);

    return (
        <div className='add-game'>
            {!(gameParams || savedGame)
                ? <AddGameForm
                    setGameParams={setGameParams}
                />
                : <SetRounds
                    gameParams={savedGame ? savedGame.gameParams : gameParams}
                    savedGame={savedGame}
                />
            }
        </div>
    )

};

export default AddGame;