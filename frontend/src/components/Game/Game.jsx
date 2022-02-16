import {useEffect, useRef, useState} from "react";
import {observer} from "mobx-react-lite";
import {useHistory} from "react-router-dom";
import {Field, Form, Formik} from "formik";
import ReactTooltip from 'react-tooltip';
import {getSnapshot} from "mobx-state-tree";
import {toast} from "react-toastify";
import {CSSTransition, SwitchTransition} from "react-transition-group";

import '../../common/round.css';
import './Game.css';

import {listenerUrls} from "../../common/listener";
import {Stage, toOrdinal} from "../../common/utils";
import {useStore} from "../../common/RootStore";
import GameSessionListener from "./listener";
import {chooseQuestion, getAvatarUrl, getGameState, getHostImageUrl, leaveGameSession, submitAnswer} from "./services";

const PlayerControls = observer(() => {
    const {gameStore: store} = useStore();
    const history = useHistory();

    return (
        <div className='player-controls'>
            <Formik
                initialValues={{
                    answer: '',
                }}
                onSubmit={(values, {setSubmitting, resetForm}) => {
                    if (values.answer?.length > 0) {
                        submitAnswer(values.answer)
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
                        history.push('/games');
                    else
                        leaveGameSession()
                            .then(() => {
                                history.push('/games');
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
            hostText = 'ожидаем игроков';
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
            hostText += 'Впереди финальный раунд.';
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
            hostText = `${themeName} за ${value}`;
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
            hostText = 'Финальный раунд';
            break;
        }
        case Stage.END_GAME: {
            const winner = store.players.reduce((a, b) => a.score > b.score ? a : b);
            hostText = `Победил ${winner.nickname}!`;
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
            <div>
                {hostText}
            </div>
        </div>
    )
});

const QuestionScreen = observer(() => {
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
        <div className='question'>
            {screenText}
        </div>
    )
});

const QuestionCell = observer(({question, themeIndex, questionIndex}) => {
    const [clicked, setClicked] = useState(false);

    return (
        <td className={`question-cell ${question.isAnswered ? 'empty' : ''} ${clicked ? 'clicked' : ''}`}
            onClick={() => {
                setClicked(true);
                chooseQuestion(themeIndex, questionIndex)
                    .catch(errorCode => {
                        switch (errorCode) {
                            case 'not_current_player':
                                toast('Сейчас выбираете не вы');
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
            }}
        >
            {question.isAnswered ? undefined : question.value}
        </td>
    )
});

const Theme = ({theme, themeIndex}) => {
    return (
        <tr>
            <td>
                {theme.name}
            </td>
            {theme.questions.map((question, index) =>
                <QuestionCell
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
        <table className='round round-table'>
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
                return <QuestionScreen/>
        }
    }

    return (
        <div className='game-screen'>
            <SwitchTransition className='game-screen'>
                <CSSTransition
                    key={state}
                    timeout={1000}
                    classNames="game-screen"
                >
                    {getChild()}
                </CSSTransition>
            </SwitchTransition>
        </div>
    )
});

const PlayerCard = observer(({player}) => {
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
                className='player-card'
                data-tip=''
                data-for={player.nickname + '-tooltip'}
                ref={tooltipRef}
            >
                <img
                    src={getAvatarUrl()}
                    alt={player.nickname}
                />
                <div>{player.nickname}</div>
                <div>{player.score}</div>
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
    const history = useHistory();

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
                history.push('/games');
            });

        return () => {
            listener?.close();
            store.clear();
        }
    }, [store]);

    useEffect(() => {
        function wait(callback) {
            setTimeout(callback, 5000)
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