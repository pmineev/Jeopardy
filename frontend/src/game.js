import './game.css';
import './round.css';
import {useEffect, useReducer, useState} from "react";
import Notifier from "./notifiers";
import {GameSessionService} from "./services";
import {useHistory, useLocation} from "react-router-dom";
import {Field, Form, Formik} from "formik";
import ReactTooltip from 'react-tooltip';
import ReactCSSTransitionReplace from 'react-css-transition-replace';
import {State, toOrdinal} from "./utils";

const gameSessionService = new GameSessionService();

const PlayerControls = (props) => {
    return (
        <div className='player-controls'>
            <Formik
                initialValues={{
                    answer: '',
                }}
                onSubmit={(values, {setSubmitting, resetForm}) => {
                    if (values.answer?.length > 0) {
                        gameSessionService.submit_answer(props.id, values.answer);
                        resetForm();
                        setSubmitting(false);
                    }
                }}
            >
                <Form>
                    <Field id="answer" as='textarea' name="answer" placeholder="Введите ответ"/>
                    <button type="submit">Ответить</button>
                </Form>
            </Formik>

            <button
                onClick={() => {
                    gameSessionService.leave(props.id);
                    localStorage.removeItem('gameSession');
                    localStorage.removeItem('game_session_id');
                    props.history.push('/games');
                }}
            >
                Выйти из игры
            </button>
        </div>
    )
}

const HostCard = (props) => {
    let hostText = '';
    let hostImageURL;

    switch (props.state) {
        case State.WAITING: {
            hostText = 'ожидаем игроков';
            hostImageURL = gameSessionService.get_host_image_url(State.WAITING);
            break;
        }
        case State.ROUND_ENDED:
        case State.FINAL_ROUND_STARTED:
        case State.CHOOSING_QUESTION:
        case State.TIMEOUT: {
            if (props.state === State.TIMEOUT)
                hostText = `Правильный ответ: ${props.current_answer.text}. `
            else if (props.current_answer?.is_correct)
                hostText = 'Правильно! ';

            if (props.state === State.ROUND_ENDED) {
                hostText += 'Раунд закончен.';
                hostImageURL = gameSessionService.get_host_image_url(State.ROUND_STARTED);
            } else if (props.state === State.FINAL_ROUND_STARTED) {
                hostText += 'Впереди финальный раунд.';
                hostImageURL = gameSessionService.get_host_image_url(State.ROUND_STARTED);
            } else {
                hostText += `${props.current_player.nickname}, выбирайте вопрос.`;
                hostImageURL = gameSessionService.get_host_image_url(State.CHOOSING_QUESTION);
            }
            break;
        }
        case State.ANSWERING: {
            const t = props.current_question.theme_order;
            const themeName = props.themes[t].name;
            const value = props.current_question.value;
            hostText = `${themeName} за ${value}`;
            hostImageURL = gameSessionService.get_host_image_url(State.ANSWERING);

            if (props.current_answer.text.length > 0) {
                hostText = 'Неверно.';
                hostImageURL = gameSessionService.get_host_image_url('wrong');
            }
            break;
        }
        case State.FINAL_ROUND: {
            hostImageURL = gameSessionService.get_host_image_url(State.FINAL_ROUND);
            hostText = 'Финальный раунд';
            break;
        }
        case State.END_GAME: {
            const winner = props.players.reduce((a, b) => a.score > b.score ? a : b);
            hostText = `Победил ${winner.nickname}!`;
            hostImageURL = gameSessionService.get_host_image_url(State.END_GAME);
            break;
        }
        default: {
            hostText = '';
            hostImageURL = gameSessionService.get_host_image_url(State.WAITING);
        }
    }

    return (
        <div className='host-card'>
            <img
                src={hostImageURL}
                alt='host'
            />
            <div>
                {hostText}
            </div>
        </div>
    )
}


const QuestionScreen = (props) => {
    console.log(props.text);
    return (
        <div className='question'>
            {props.text}
        </div>
    )
}

const QuestionCell = (props) => {

    return (
        <td className={`question-cell ${props.is_answered ? 'empty' : ''}`}
            onClick={() => props.questionChosen(props.theme_order, props.question_order)}
        >
            {props.value}
        </td>
    )
}
const Theme = (props) => {

    return (
        <tr>
            <td>
                {props.name}
            </td>
            {props.questions.map((question, index) =>
                <QuestionCell
                    key={question.value}
                    value={question.value}
                    is_answered={question.is_answered}
                    theme_order={props.theme_order}
                    question_order={index}
                    questionChosen={props.questionChosen}
                />
            )}
        </tr>

    )
}
const RoundTable = (props) => {

    return (
        <table className='round round-table'>
            <tbody>
            {props.themes.map((theme, index) =>
                <Theme
                    key={theme.name}
                    name={theme.name}
                    questions={theme.questions}
                    theme_order={index}
                    questionChosen={props.questionChosen}
                />
            )}
            </tbody>
        </table>
    )
}

const GameScreen = (props) => {
    return (
        <ReactCSSTransitionReplace
            className='game-screen'
            transitionName="game-screen"
            transitionEnterTimeout={1000}
            transitionLeaveTimeout={1000}
        >
            {([State.CHOOSING_QUESTION, State.TIMEOUT].includes(props.state))
                ? <RoundTable
                    key='table'
                    themes={props.round.themes}
                    questionChosen={(theme_order, question_order) => {
                        gameSessionService.choose_question(props.id, theme_order, question_order);
                    }}
                />
                : <QuestionScreen
                    key='question'
                    text={([State.ROUND_STARTED, State.FINAL_ROUND_STARTED].includes(props.state))
                        ? props.round_text
                        : props.question_text}
                />

            }
        </ReactCSSTransitionReplace>
    )
}

const PlayerCard = (props) => {
    const [answer, setAnswer] = useState('');
    let tooltipRef;

    async function wait() {
        await new Promise(r =>
            setTimeout(() =>
                ReactTooltip.hide(tooltipRef), 3000));
    }

    useEffect(() => {
        if (props.current_answer.text.length > 0
            && props.current_answer?.player?.nickname === props.nickname) {
            setAnswer(props.current_answer.text);
            ReactTooltip.show(tooltipRef);

            wait();
        }

    }, [props.current_answer])

    useEffect(() => {
        setAnswer(props.answer);
        ReactTooltip.show(tooltipRef);
        wait()
    }, [props.answer])

    return (
        <>
            <div
                className='player-card'
                data-tip
                data-for={props.nickname + '_tooltip'}
                ref={ref => tooltipRef = ref}
            >
                <img
                    src={props.avatarURL}
                    alt={props.nickname}
                />
                <div>{props.nickname}</div>
                <div>{props.score}</div>
            </div>
            <ReactTooltip
                className='tooltip'
                id={props.nickname + '_tooltip'}
                effect='solid'
                delayHide={3000}
                event='null'
                getContent={() => answer}
            >
            </ReactTooltip>
        </>
    )
}

const Players = (props) => {
    return (
        <div className='players'>
            {props.players.length > 0 && props.players.map(player =>
                <PlayerCard
                    key={player.nickname}
                    nickname={player.nickname}
                    score={player.score}
                    is_playing={player.is_playing}
                    current_answer={props.current_answer}
                    answer={player.answer}
                    avatarURL={gameSessionService.get_avatar_url()}
                />
            )}
        </div>
    )
}

function not_answered_questions_count(round) {
    let answered = 0;
    for (let t of round.themes)
        answered += t.questions.filter(q => q.is_answered).length;

    const not_answered = round.themes.length * round.themes[0].questions.length - answered;
    console.log(not_answered);
    console.log(round.themes.length);
    console.log(round.themes[0].questions.length);
    console.log(answered);
    return not_answered;
}

function reducer(gameSession, [event, data]) {
    console.log('r', event);
    switch (event) {
        case 'init': {
            return {
                ...gameSession,
                ...data,
                is_initialized: true,
                state: State.WAITING
            };
        }
        case 'set': {
            return {
                ...data
            };
        }
        case 'set_state': {
            return {
                ...gameSession,
                state: data
            };
        }
        case 'clear_current_answer': {
            return {
                ...gameSession,
                current_answer: {text: '', player: {nickname: ''}}
            };
        }
        case 'player_joined': {
            const index = gameSession.players.findIndex(p => p.nickname === data.nickname);
            if (index === -1)
                return {
                    ...gameSession,
                    players: gameSession.players.concat(data),
                    current_players: gameSession.current_players + 1
                }
            else
                return {
                    ...gameSession,
                    players: gameSession.players.slice(0, index)
                        .concat(data
                            , gameSession.players.slice(index + 1))
                }
        }
        case 'player_left': {
            const index = gameSession.players.findIndex(p => p.nickname === data.nickname);
            if (gameSession.state === State.WAITING)
                return {
                    ...gameSession,
                    players: gameSession.players.slice(0, index)
                        .concat(gameSession.players.slice(index + 1))
                }
            else
                return {
                    ...gameSession,
                    players: gameSession.players.slice(0, index)
                        .concat(data
                            , gameSession.players.slice(index + 1))
                }
        }
        case 'round_started': {
            return {
                ...gameSession,
                round: data,
                round_text: toOrdinal(data.order + 1) + ' раунд',
                state: data.order > 0 ? State.ROUND_ENDED : State.ROUND_STARTED
            }
        }
        case 'final_round_started': {
            return {
                ...gameSession,
                current_question: data,
                round_text: 'Финальный раунд',
                state: State.FINAL_ROUND_STARTED
            }
        }
        case 'current_player_chosen': {
            return {
                ...gameSession,
                current_player: data
                //state: State.CHOOSING_QUESTION
            }
        }
        case 'current_question_chosen': {
            return {
                ...gameSession,
                current_question: data,
                current_answer: {text: '', player: {nickname: ''}},
                state: State.ANSWERING
            }
        }
        case 'player_answered': {
            const t = gameSession.current_question.theme_order;
            const q = gameSession.current_question.question_order;
            const playerIndex = gameSession.players.findIndex(p => p.nickname === data.player.nickname);
            if (data.is_correct)
                return {
                    ...gameSession,
                    current_answer: data,
                    current_player: data.player,
                    state: not_answered_questions_count(gameSession.round) === 1
                        ? gameSession.state
                        : State.CHOOSING_QUESTION,
                    round: {
                        ...gameSession.round,
                        themes: gameSession.round.themes.slice(0, t)
                            .concat(
                                {
                                    ...gameSession.round.themes[t],
                                    questions: gameSession.round.themes[t].questions.slice(0, q)
                                        .concat(
                                            {
                                                ...gameSession.round.themes[t].questions[q],
                                                is_answered: true
                                            },
                                            gameSession.round.themes[t].questions.slice(q + 1)
                                        )
                                },
                                gameSession.round.themes.slice(t + 1)
                            )
                    },
                    players: gameSession.players.slice(0, playerIndex)
                        .concat(data.player,
                            gameSession.players.slice(playerIndex + 1))
                }
            else
                return {
                    ...gameSession,
                    current_answer: data,
                    players: gameSession.players.slice(0, playerIndex)
                        .concat(data.player,
                            gameSession.players.slice(playerIndex + 1))
                }
        }
        case 'question_timeout': {
            const t = gameSession.current_question.theme_order;
            const q = gameSession.current_question.question_order;
            return {
                ...gameSession,
                current_answer: data,
                state: State.TIMEOUT,
                round: {
                    ...gameSession.round,
                    themes: gameSession.round.themes.slice(0, t)
                        .concat(
                            {
                                ...gameSession.round.themes[t],
                                questions: gameSession.round.themes[t].questions.slice(0, q)
                                    .concat(
                                        {
                                            ...gameSession.round.themes[t].questions[q],
                                            is_answered: true
                                        },
                                        gameSession.round.themes[t].questions.slice(q + 1)
                                    )
                            },
                            gameSession.round.themes.slice(t + 1)
                        )
                }
            }
        }
        case 'final_round_timeout': {
            return {
                ...gameSession,
                players: data.players,
                state: State.END_GAME
            }
        }
        default:
            throw new Error('нет такого события')
    }
}

const Game = () => {
    const history = useHistory();
    const location = useLocation();
    const [gameSession, dispatch] = useReducer(reducer,
        {
            id: -1,
            current_question: {
                text: ''
            },
            current_answer: {
                text: '',
                player: {
                    nickname: ''
                }
            },
            players: [],
            round: {
                order: -1,
                themes: []
            }
        });

    useEffect(() => {
        document.title = 'Игра'

        const game_session_id = location.state?.id ?? localStorage.getItem('game_session_id');
        const notifier = new Notifier('game', game_session_id);
        notifier.setListener(dispatch);

        localStorage.setItem('game_session_id', game_session_id);

        const savedGameSession = JSON.parse(localStorage.getItem('gameSession'));
        console.log('stor', savedGameSession);
        if (!savedGameSession?.is_initialized) {
            console.log('init', location.state);
            dispatch(['init', location.state]);
        } else
            dispatch(['set', savedGameSession]);

        return () => notifier.close();

    }, []);

    useEffect(() => {
        localStorage.setItem('gameSession', JSON.stringify(gameSession));
    }, [gameSession]);


    useEffect(() => {
        async function wait(state) {
            console.log('st', state);
            await new Promise(r =>
                setTimeout(() =>
                    dispatch(['set_state', state]), 3000));
        }

        if (gameSession.state === State.ROUND_ENDED)
            wait(State.ROUND_STARTED)
        else if (gameSession.state === State.ROUND_STARTED) {
            dispatch(['clear_current_answer', null]);
            wait(State.CHOOSING_QUESTION)
        } else if (gameSession.state === State.FINAL_ROUND_STARTED)
            wait(State.FINAL_ROUND)
    }, [gameSession.state]);

    return (
        <div className='game'>
            {console.log('gsr', gameSession)}

            <GameScreen
                state={gameSession.state}
                round={gameSession.round}
                id={gameSession.id}
                question_text={gameSession.current_question.text}
                round_text={gameSession.round_text}
            />

            <Players
                players={gameSession.players}
                current_answer={gameSession.current_answer}
            />

            <HostCard
                state={gameSession.state}
                current_player={gameSession.current_player}
                current_question={gameSession.current_question}
                current_answer={gameSession.current_answer}
                themes={gameSession.round.themes}
                players={gameSession.players}
            />

            <PlayerControls
                id={gameSession.id}
                history={history}
            />
        </div>
    )
};

export default Game