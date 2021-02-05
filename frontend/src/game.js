import './game.css';
import './round.css';
import {useEffect, useReducer} from "react";
import Notifier from "./notifiers";
import {GameSessionService} from "./services";
import {useLocation} from "react-router-dom";
import {Field, Form, Formik} from "formik";

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
                onClick={() => gameSessionService.leave(props.id)}
            >
                Выйти из игры
            </button>
        </div>
    )
}

const HostCard = (props) => {
    let hostText;
    switch (props.state) {
        case State.WAITING: {
            hostText = 'ожидаем игроков';
            break;
        }
        case State.CHOOSING_QUESTION: {
            hostText = 'выбор вопроса'
            break;
        }
    }

    return (
        <div className='host-card'>
            {hostText}
        </div>
    )
}

const PlayerCard = (props) => {

    return (
        <div className='player-card'>
            <div>{props.nickname}</div>
            <div>{props.score}</div>
        </div>
    )
}

const Question = (props) => {

    return (
        <div className='question'>
            {props.text}
        </div>
    )
}

const QuestionCell = (props) => {

    return (
        <td className='question-cell'
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
        <div className='game-screen'>
            {props.state === State.CHOOSING_QUESTION &&
            <RoundTable
                themes={props.round.themes}
                questionChosen={(theme_order, question_order) => {
                    gameSessionService.choose_question(props.id, theme_order, question_order);
                }}
            />}

            {props.state !== State.CHOOSING_QUESTION &&
            <Question
                text={props.current_question.text}
            />
            }
        </div>
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
                />
            )}
        </div>
    )
}

const State = Object.freeze({
    WAITING: 0,
    CHOOSING_QUESTION: 1,
    ANSWERING: 2,
    TIMEOUT: 3,
    FINAL_ROUND: 4,
    END_GAME: 5
})

function reducer(gameSession, [event, data]) {
    switch (event) {
        case 'init': {
            return {
                ...gameSession,
                is_initialized: true,
                id: data.id,
                current_players: data.current_players,
                max_players: data.max_players,
                players: [{
                    nickname: data.creator,
                    score: 0,
                    is_playing: true
                }],
                state: State.WAITING
            };
        }
        case 'set': {
            return {
                ...data
            };
        }
        case 'player_joined': {
            const index = gameSession.players.findIndex(p => p.nickname === data.nickname);
            if (gameSession.state === State.WAITING)
                return {
                    ...gameSession,
                    players: gameSession.players.concat(data),
                    current_players: gameSession.current_players + 1,
                    state: gameSession.current_players + 1 === gameSession.max_players
                        ? State.CHOOSING_QUESTION
                        : State.WAITING
                }
            else
                return {
                    ...gameSession,
                    players: gameSession.players.slice(0, index - 1)
                        .concat(data
                            , gameSession.players.slice(index + 1))
                }
        }
        case 'player_left': {
            const index = gameSession.players.findIndex(p => p.nickname === data.nickname);
            if (gameSession.state === State.WAITING)
                return {
                    ...gameSession,
                    players: gameSession.players.slice(0, index - 1)
                        .concat(gameSession.players.slice(index + 1))
                }
            else
                return {
                    ...gameSession,
                    players: gameSession.players.slice(0, index - 1)
                        .concat(data
                            , gameSession.players.slice(index + 1))
                }
        }
        case 'round_started': {
            return {
                ...gameSession,
                round: data,
                state: State.CHOOSING_QUESTION
            }
        }
        case 'final_round_started': {
            return {
                ...gameSession,
                final_round: data,
                state: State.FINAL_ROUND
            }
        }
        case 'current_player_chosen': {
            return {
                ...gameSession,
                current_player: data,
                state: State.CHOOSING_QUESTION
            }
        }
        case 'current_question_chosen': {
            return {
                ...gameSession,
                current_question: data,
                state: State.ANSWERING
            }
        }
        case 'player_answered': {
            const t = gameSession.current_question.theme_order;
            const q = gameSession.current_question.question_order;
            if (data.answer.is_correct)
                return {
                    ...gameSession,
                    current_answer: data.answer.text,
                    responding_player: data.player,
                    round: {
                        ...gameSession.round,
                        themes: gameSession.round.themes.slice(0, t - 1)
                            .concat(
                                {
                                    ...gameSession.round.themes[t],
                                    questions: gameSession.round.themes[t].questions.slice(0, q - 1)
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
            else
                return {
                    ...gameSession,
                    current_answer: data.answer,
                    responding_player: data.player
                }
        }
        case 'question_timeout': {
            const t = gameSession.current_question.theme_order;
            const q = gameSession.current_question.question_order;
            return {
                ...gameSession,
                current_answer: data.answer,
                state: State.TIMEOUT,
                round: {
                    ...gameSession.round,
                    themes: gameSession.round.themes.slice(0, t - 1)
                        .concat(
                            {
                                ...gameSession.round.themes[t],
                                questions: gameSession.round.themes[t].questions.slice(0, q - 1)
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
                players: data,
                state: State.END_GAME
            }
        }
        default:
            throw new Error('нет такого события')
    }
}

const Game = () => {
    const location = useLocation();
    const [gameSession, dispatch] = useReducer(reducer,
        {
            current_question: {text: 'ожидаем'},
            players: [],
            themes: [],
            id: -1
        });

    useEffect(() => {
        const game_session_id = location.state?.id ?? localStorage.getItem('game_session_id');
        const notifier = new Notifier('game', game_session_id);
        notifier.setListener(dispatch);

        localStorage.setItem('game_session_id', game_session_id);

        console.log('stor', localStorage.getItem('gameSession'));
        const savedGameSession = JSON.parse(localStorage.getItem('gameSession'));
        if (!savedGameSession?.is_initialized) {
            console.log('init');
            dispatch(['init', location.state]);
            location.state = '';
        } else
            dispatch(['set', savedGameSession]);

    }, []);

    useEffect(() => {
        localStorage.setItem('gameSession', JSON.stringify(gameSession));
        console.log('gs', gameSession);
    }, [gameSession]);

    return (
        <div className='game'>
            {console.log('gsr', gameSession)}

            <GameScreen
                state={gameSession.state}
                round={gameSession.round}
                id={gameSession.id}
                current_question={gameSession.current_question}
            />

            <Players
                players={gameSession.players}
            />

            <HostCard
                state={gameSession.state}
            />

            <PlayerControls
                id={gameSession.id}
            />
        </div>
    )
};

export default Game