import {Form, Formik} from "formik";
import * as Yup from "yup";
import {SubmitError, TextInput} from "./inputs";
import {useState} from "react";
import Modal from "react-modal";
import {useHistory, useLocation} from "react-router-dom";

const AddGameForm = () => {
    const history = useHistory();

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
                onSubmit={(values, {setSubmitting}) => {
                    setSubmitting(false);
                    history.push('/games/new/rounds', {...values, themes: []});
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
            className={props.isSet ? '' : 'empty'}
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
            <td key={props.name}>{props.name}</td>
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
                        alert('Невероятно');
                        setSubmitting(false)
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


function toOrdinal(n) {
    const ordinals = ['Нулевой',
        'Первый',
        'Второй',
        'Третий',
        'Четвертый',
        'Пятый',
        'Шестой',
        'Седьмой',
        'Восьмой',
        'Девятый'
    ]

    return ordinals[n];
}

const AddGame = () => {
    const gameParams = useLocation().state;
    const [isAddThemeFormOpen, setIsAddThemeFormOpen] = useState(false);
    const [isAddQuestionFormOpen, setIsAddQuestionFormOpen] = useState(false);
    const [isAddFinalQuestionFormOpen, setIsAddFinalQuestionFormOpen] = useState(false);
    const [themes, setThemes] = useState(gameParams.themes);
    const [currentRound, setCurrentRound] = useState(1);
    const [questions, setQuestions] = useState([]);
    const [questionParams, setQuestionParams] = useState({index: -1});

    console.log('q', questions);
    console.log('th', themes);
    console.log(toOrdinal(currentRound));
    console.log(currentRound);

    return (
        <>
            <header>{toOrdinal(currentRound)} раунд</header>

            <table className="add-game-table">
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

            <button onClick={() => setIsAddThemeFormOpen(true)}>Добавить тему</button>

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
                className='modal add-theme'
                ovrlayClassName='overlay modal add-theme'
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
                className='modal add-question'
                ovrlayClassName='overlay modal add-question'
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
                className='modal add-final-question'
                ovrlayClassName='overlay modal add-final-question'
                isOpen={isAddFinalQuestionFormOpen}
                onRequestClose={() => setIsAddFinalQuestionFormOpen(false)}
                ariaHideApp={false}
            >
                <AddFinalQuestionForm
                    rounds_count={gameParams.rounds_count}
                    questions_count={gameParams.questions_count}
                    questions={questions}
                    themes={themes}
                    initialValues={questions.filter(q => q.theme === 'final')[0]}
                    setFinalQuestion={question => {
                        let i = questions.findIndex(q => q.theme === 'final');
                        let newQuestion = {
                            theme: 'final',
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
};

export {AddGameForm, AddGame};