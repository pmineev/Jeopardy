import {useEffect, useRef, useState} from "react";
import {observer} from "mobx-react-lite";
import {useNavigate} from "react-router-dom";
import {Field, Form, Formik} from "formik";
import ReactTooltip from 'react-tooltip';
import {getSnapshot} from "mobx-state-tree";
import {toast} from "react-toastify";
import {CSSTransition, SwitchTransition} from "react-transition-group";

import {listenerUrls} from "../../common/listener";
import {Stage, toOrdinal} from "../../common/utils";
import useStore from "../../common/RootStore";
import GameSessionListener from "./listener";
import {getNickname} from "../../common/auth/services";
import {chooseQuestion, getAvatarUrl, getGameState, getHostImageUrl, leaveGameSession, submitAnswer} from "./services";

const PlayerControls = observer(() => {
    const {gameStore: store} = useStore();
    const navigate = useNavigate();

    return (
        <div className='player-controls'>
            <Formik
                initialValues={{
                    answer: '',
                }}
                onSubmit={({answer}, {setSubmitting, resetForm}) => {
                    if (answer?.length > 0) {
                        submitAnswer(answer)
                            .then(() => {
                                resetForm();
                                setSubmitting(false);
                            })
                            .catch(errorCode => {
                                switch (errorCode) {
                                    case 'wrong_stage':
                                        toast('Сейчас нельзя отправлять ответ');
                                        break;
                                    case 'game_session_not_found':
                                        toast.error('Игра не найдена');
                                        break;
                                    default:
                                        console.log(errorCode);
                                }
                            });
                    }
                }}
            >
                {({handleSubmit}) => (
                    <Form>
                        <Field id="answer"
                               as='textarea'
                               name="answer"
                               placeholder="Введите ответ"
                               onKeyPress={event => {
                                   if (event.key === 'Enter') {
                                       event.preventDefault();
                                       handleSubmit();
                                   }
                               }}
                        />
                        <button type="submit">Ответить</button>
                    </Form>
                )}
            </Formik>

            <button
                onClick={() => {
                    if (store.stage === Stage.END_GAME)
                        navigate('/games');
                    else
                        leaveGameSession()
                            .then(() => {
                                navigate('/lobby');
                            })
                            .catch(errorCode => {
                                switch (errorCode) {
                                    case 'game_session_not_found':
                                        toast.error('Игра не найдена');
                                        break;
                                    default:
                                        console.log(errorCode);
                                }
                            });
                }}
            >
                Выйти из игры
            </button>
        </div>
    )
});

const HostCard = observer(() => {
    const {gameStore: store} = useStore();
    let hostText = '';
    let hostImageURL;

    console.log("hostcard", getSnapshot(store));

    switch (store.stage) {
        case Stage.WAITING: {
            hostText = `Ожидаем игроков...`;
            hostImageURL = getHostImageUrl(Stage.WAITING);
            break;
        }
        case Stage.CORRECT_ANSWER: {
            hostText = 'Правильно!';
            hostImageURL = getHostImageUrl(Stage.ANSWERING);
            break;
        }
        case Stage.TIMEOUT: {
            hostText = `Правильный ответ: ${store.correctAnswer}. `
            hostImageURL = getHostImageUrl(Stage.CHOOSING_QUESTION);
            break;
        }
        case Stage.ROUND_ENDED: {
            hostText += 'Раунд закончен.';
            hostImageURL = getHostImageUrl(Stage.ROUND_STARTED);
            break;
        }
        case Stage.FINAL_ROUND_STARTED: {
            hostText += '';
            hostImageURL = getHostImageUrl(Stage.ROUND_STARTED);
            break;
        }
        case Stage.CHOOSING_QUESTION: {
            hostText += `${store.currentPlayer.nickname}, выбирайте вопрос.`;
            hostImageURL = getHostImageUrl(Stage.CHOOSING_QUESTION);
            break;
        }
        case Stage.ANSWERING: {
            const themeName = store.currentRound.themes[store.currentQuestion.themeIndex].name;
            const value = store.currentQuestion.value;
            hostText = `${themeName} за ${value}.`;
            hostImageURL = getHostImageUrl(Stage.ANSWERING);

            if (store.answeringPlayer)
                if (!store.answeringPlayer.answer.isCorrect) {
                    hostText = 'Неверно.';
                    hostImageURL = getHostImageUrl('wrong');
                }
            break;
        }
        case Stage.FINAL_ROUND: {
            hostImageURL = getHostImageUrl(Stage.FINAL_ROUND);
            hostText = 'Финальный раунд.';
            break;
        }
        case Stage.END_GAME: {
            const winner = store.players.reduce((a, b) => a.score > b.score ? a : b);
            hostText = `Правильный ответ: ${store.finalRound.answer}.\nПобедил ${winner.nickname}!`;
            hostImageURL = getHostImageUrl(Stage.END_GAME);
            break;
        }
        default: {
            hostText = '';
            hostImageURL = getHostImageUrl(Stage.WAITING);
        }
    }

    return (
        <div className='host-card'>
            <img
                src={hostImageURL}
                alt='host'
            />
            <div className='text'>
                {hostText}
            </div>
        </div>
    )
});

const TextScreen = observer(() => {
    const {gameStore: store} = useStore();
    const [screenText, setScreenText] = useState('')

    useEffect(() => {
        switch (store.stage) {
            case Stage.ROUND_STARTED: {
                setScreenText(toOrdinal(store.currentRound.order) + ' раунд');
                break;
            }
            case Stage.FINAL_ROUND_STARTED: {
                setScreenText('Финальный раунд');
                break;
            }
            case Stage.ANSWERING: {
                setScreenText(store.currentQuestion.text);
                break;
            }
            case Stage.FINAL_ROUND: {
                setScreenText(store.finalRound.text);
                break;
            }
            default:
                break;
        }
    }, [store.stage])


    return (
        <div className='text'>
            {screenText}
        </div>
    )
});

const Question = observer(({question, themeIndex, questionIndex}) => {
    const {gameStore: store} = useStore();
    const [selected, setSelected] = useState(false);
    const nickname = getNickname();

    useEffect(() => {
        if (store.currentQuestion?.question === question)
            setSelected(true);
        if (store.stage !== Stage.ANSWERING)
            setSelected(false);
    }, [store.currentQuestion, store.stage])

    return (
        <td className={`${question.isAnswered ? 'empty' : ''} ${selected ? 'selected' : ''}`}
            onClick={() => {
                if (store.currentPlayer.nickname === nickname && !question.isAnswered) {
                    setSelected(true);
                    chooseQuestion(themeIndex, questionIndex)
                        .catch(errorCode => {
                            switch (errorCode) {
                                case 'not_current_player':
                                    toast.error('Сейчас выбираете не вы');
                                    break;
                                case 'wrong_stage':
                                    toast('Сейчас нельзя выбирать вопрос');
                                    break;
                                case 'game_session_not_found':
                                    toast.error('Игра не найдена');
                                    break;
                                case 'wrong_question_request':
                                    toast.error('Некорректный запрос');
                                    break;
                                default:
                                    console.log(errorCode);
                            }
                        });
                }
            }}
        >
            {question.isAnswered ? undefined : question.value}
        </td>
    )
});

const Theme = ({theme, themeIndex}) => {
    return (
        <tr>
            <th>
                {theme.name}
            </th>
            {theme.questions.map((question, index) =>
                <Question
                    key={question.value}
                    themeIndex={themeIndex}
                    question={question}
                    questionIndex={index}
                />
            )}
        </tr>

    )
}

const RoundTable = ({themes}) => {
    return (
        <table>
            <tbody>
            {themes.map((theme, index) =>
                <Theme
                    key={theme.name}
                    theme={theme}
                    themeIndex={index}
                />
            )}
            </tbody>
        </table>
    )
}

const GameScreen = observer(() => {
    const {gameStore: store} = useStore();
    const [state, setState] = useState('empty')
    let ref = useRef();

    useEffect(() => {
        switch (store.stage) {
            case Stage.CHOOSING_QUESTION: {
                setState('roundTable');
                break;
            }
            case Stage.WAITING:
            case Stage.ROUND_ENDED: {
                setState('empty');
                break;
            }
            default:
                setState('text');
        }
    }, [store.stage])

    const getChild = () => {
        switch (state) {
            case 'roundTable':
                return <RoundTable
                    themes={store.currentRound.themes}
                />
            case 'empty':
                return <></>
            default:
                return <TextScreen/>
        }
    }

    return (
        <div className='game-screen'>
            <SwitchTransition className='game-screen'>
                <CSSTransition
                    key={state}
                    timeout={1000}
                    classNames="game-screen"
                    nodeRef={ref}
                >
                    <div ref={ref} className='transition-wrapper'>
                        {getChild()}
                    </div>
                </CSSTransition>
            </SwitchTransition>
        </div>
    )
});

const PlayerCard = observer(({player}) => {
    const {gameStore: store} = useStore();
    const [timeoutId, setTimeoutId] = useState(null);
    const tooltipRef = useRef(null);

    useEffect(() => {
        const delayHide = (ms) => {
            clearTimeout(timeoutId);
            setTimeoutId(setTimeout(ReactTooltip.hide, ms, tooltipRef.current));
        };

        ReactTooltip.show(tooltipRef.current);

        delayHide(3000);
    }, [player.answer])

    return (
        <>
            <div
                className={`player-card ${player === store.currentPlayer ? 'current' : ''}`}
                data-tip=''
                data-for={player.nickname + '-tooltip'}
                ref={tooltipRef}
            >
                <img
                    src={getAvatarUrl()}
                    alt={player.nickname}
                />
                <div
                    className='nickname'
                >
                    {player.nickname}
                </div>
                <div>
                    {player.score}
                </div>
            </div>
            <ReactTooltip
                className='tooltip'
                id={player.nickname + '-tooltip'}
                effect='solid'
            >
                {player.answer?.text}
            </ReactTooltip>
        </>
    )
});

const Players = observer(() => {
    const {gameStore: store} = useStore();

    return (
        <div className='players'>
            {store.players.map((player) =>
                <PlayerCard
                    key={player.nickname}
                    player={player}
                />
            )}
        </div>
    )
});

const Game = observer(() => {
    const {gameStore: store} = useStore();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Игра';

        let listener;

        getGameState()  // TODO! race condition
            .then(response => {
                store.initialize(response.data);
                listener = new GameSessionListener(listenerUrls.gameSession);
                listener.setHandler(store.eventHandler);
            })
            .catch(errorCode => {
                switch (errorCode) {
                    case 'game_session_not_found':
                        toast("Вы не играете");
                        break;
                    default:
                        console.log(errorCode);
                }
                navigate('/games');
            });

        return () => {
            listener?.close();
            store.clear();
        }
    }, [store]);

    useEffect(() => {
        let timeoutId;

        function wait(callback) {
            timeoutId = setTimeout(callback, 5000);
        }

        switch (store.stage) {
            case Stage.ROUND_ENDED:
                wait(() => {
                    const nextStage = store.finalRound ? Stage.FINAL_ROUND_STARTED : Stage.ROUND_STARTED
                    store.setStage(nextStage)
                });
                break;
            case Stage.ROUND_STARTED:
                wait(() => {
                    store.setStage(Stage.CHOOSING_QUESTION);
                    store.clearAnswers();
                });
                break;
            case Stage.CORRECT_ANSWER:
            case Stage.TIMEOUT:
                const nextStage = store.isNoMoreQuestions ? Stage.ROUND_ENDED : Stage.CHOOSING_QUESTION
                wait(() => {
                    store.setStage(nextStage);
                    store.clearAnswers();
                });
                break;
            case Stage.FINAL_ROUND_STARTED:
                wait(() => {
                    store.setStage(Stage.FINAL_ROUND);
                    store.clearAnswers();
                });
                break;
            default:
                break;
        }

        return () => {
            clearTimeout(timeoutId);
        }
    }, [store, store.stage]);

    return (
        <div className='game'>

            <GameScreen/>

            <Players/>

            <HostCard/>

            <PlayerControls/>
        </div>
    )
});

export default Game