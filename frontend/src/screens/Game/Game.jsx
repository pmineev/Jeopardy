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
import {chooseQuestion, getAvatarUrl, getGameState, leaveGameSession, submitAnswer, allowAnswers,
    confirmAnswer, rejectAnswer, startGame} from "./services";

const AnswerForm = () => {
    return (
        <Formik
            initialValues={{
                answer: '',
            }}
            onSubmit={({answer}, {setSubmitting, resetForm}) => {
                if (answer?.length > 0) {
                    submitAnswer(answer)
                        .then(() => {
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
                    resetForm();
                }
            }}
        >
            {({handleSubmit}) => (
                <Form>
                    <div className='textarea'>
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
                    </div>
                    <button type="submit">Ответить</button>
                </Form>
            )}
        </Formik>
    )
};


const AnswerButtons = observer(() => {
    const {gameStore: store} = useStore();
    return (
        <>
            <button
                 onClick={() => {
                     submitAnswer()
                         .catch(errorCode => {
                             switch (errorCode) {
                                 case 'game_session_not_found':
                                     toast.error('Игра не найдена');
                                     break;
                                 case 'wrong_stage':
                                     toast.error('Сейчас нельзя отвечать');
                                     break;
                                 default:
                                     console.log(errorCode);
                             }
                         });
                 }}
            >
                Ответить
            </button>
        </>
    )
});

const PlayerControls = observer(() => {
    const {gameStore: store} = useStore();
    return (
        <div className='player-controls'>
            {(!store.host && (store.stage === Stage.ANSWERING || store.stage === Stage.FINAL_ROUND) ||
                    store.host && store.stage === Stage.FINAL_ROUND_ANSWERING) &&
                <AnswerForm/>
            }
            {store.host && store.stage === Stage.ANSWERING &&
                <AnswerButtons/>
            }
        </div>
    )
});

const HostControls = observer(() => {
    const {gameStore: store} = useStore();
    return (
        <div className='host-controls'>
            {(store.stage === Stage.WAITING && store.isAllPlayersJoined) &&
                <button
                     onClick={() => {
                         startGame()
                             .catch(errorCode => {
                                 switch (errorCode) {
                                     case 'game_session_not_found':
                                         toast.error('Игра не найдена');
                                         break;
                                     case 'wrong_stage':
                                         toast.error('Игра уже началась');
                                         break;
                                     default:
                                         console.log(errorCode);
                                 }
                             });
                     }}
                >
                    Начать игру
                </button>
            }
            {(store.stage === Stage.READING_QUESTION || store.stage === Stage.FINAL_ROUND) &&
                <button
                     onClick={() => {
                         allowAnswers()
                             .then(response => {
                                 store.setCorrectAnswer(response.data);
                             })
                             .catch(errorCode => {
                                 switch (errorCode) {
                                     case 'game_session_not_found':
                                         toast.error('Игра не найдена');
                                         break;
                                     case 'wrong_stage':
                                         toast.error('Неверная стадия игры');
                                         break;
                                     default:
                                         console.log(errorCode);
                                 }
                             });
                     }}
                >
                    Разрешить отвечать
                </button>
            }
            {(store.stage === Stage.PLAYER_ANSWERING || store.stage === Stage.FINAL_ROUND_ENDED) &&
                <button
                     onClick={() => {
                         confirmAnswer()
                             .catch(errorCode => {
                                 switch (errorCode) {
                                     case 'game_session_not_found':
                                         toast.error('Игра не найдена');
                                         break;
                                     case 'wrong_stage':
                                         toast.error('Неверная стадия игры');
                                         break;
                                     default:
                                         console.log(errorCode);
                                 }
                             });
                     }}
                >
                    Правильный ответ
                </button>
            }
            {(store.stage === Stage.PLAYER_ANSWERING || store.stage === Stage.FINAL_ROUND_ENDED) &&
                <button
                     onClick={() => {
                         rejectAnswer()
                             .catch(errorCode => {
                                 switch (errorCode) {
                                     case 'game_session_not_found':
                                         toast.error('Игра не найдена');
                                         break;
                                     case 'wrong_stage':
                                         toast.error('Неверная стадия игры');
                                         break;
                                     default:
                                         console.log(errorCode);
                                 }
                             });

                     }}
                >
                    Неправильный ответ
                </button>
            }
        </div>
    )
});

const Controls = observer(() => {
    const {gameStore: store} = useStore();
    const navigate = useNavigate();

    return (
        <div className='controls'>
            {store.host === getNickname()
                ? <HostControls/>
                : <PlayerControls/>
            }

            <button
                onClick={() => {
                    if (store.stage === Stage.END_GAME && !store.host)
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

    return (
        <div className='host-card'>
            <div className='picture'>
                <img
                    src={store.hostImageURL}
                    alt='host'
                />
            </div>
            <div className='text'>
                {store.hostText}
            </div>
        </div>
    )
});

const TextScreen = observer(() => {
    const {gameStore: store} = useStore();

    return (
        <div className='text'>
            {store.screenText}
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
        if (!(store.stage === Stage.ANSWERING || store.stage === Stage.READING_QUESTION))
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
                    timeout={500}
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

    const isCurrent = () => player === store.currentPlayer && store.stage === Stage.CHOOSING_QUESTION;

    return (
        <>
            <div
                className={`player-card ${isCurrent() ? 'current' : ''} ${player.isPlaying ? '' : 'inactive'}`}
                data-tip=''
                data-for={player.nickname + '-tooltip'}
                ref={tooltipRef}
            >
                <div className='avatar'>
                    <img
                        src={getAvatarUrl()}
                        alt={player.nickname}
                    />
                </div>
                <div className='nickname'>
                    {player.nickname}
                </div>
                <div className='score'>
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

        const listener = new GameSessionListener(listenerUrls.gameSession);
        listener.setHandler(store.eventHandler);

        if (!store.isInitialized)
            getGameState()
                .then(response => {
                    store.initialize(response.data);
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

    // TODO перенести в стор
    useEffect(() => {
        let timeoutId;

        function wait(callback) {
            timeoutId = setTimeout(callback, 3000);
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

            <Controls/>
        </div>
    )
});

export default Game