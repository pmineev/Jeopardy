import './game.css';
import './round.css';

import {useEffect, useState} from "react";
import {observer} from "mobx-react-lite";
import {useHistory} from "react-router-dom";
import {Field, Form, Formik} from "formik";
import ReactTooltip from 'react-tooltip';

import {GameSessionListener, listenerUrls} from "./notifiers";
import {GameSessionService} from "./services";
import {Stage, toOrdinal} from "./utils";
import {useStore} from "./stores/RootStore";

import {getSnapshot} from "mobx-state-tree";


const gameSessionService = new GameSessionService();

const PlayerControls = () => {
    const history = useHistory();

    return (
        <div className='player-controls'>
            <Formik
                initialValues={{
                    answer: '',
                }}
                onSubmit={(values, {setSubmitting, resetForm}) => {
                    if (values.answer?.length > 0) {
                        gameSessionService.submitAnswer(values.answer);
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
                    gameSessionService.leave();
                    history.push('/games');
                }}
            >
                Выйти из игры
            </button>
        </div>
    )
};

const HostCard = observer(() => {
    const {gameSessionStore: store} = useStore();
    let hostText = '';
    let hostImageURL;

    console.log("hostcard", getSnapshot(store));

    switch (store.stage) {
        case Stage.WAITING: {
            hostText = 'ожидаем игроков';
            hostImageURL = gameSessionService.getHostImageUrl(Stage.WAITING);
            break;
        }
        case Stage.TIMEOUT: {
            if (store.stage === Stage.TIMEOUT)
                hostText = `Правильный ответ: ${store.correctAnswer}. `
            hostImageURL = gameSessionService.getHostImageUrl(Stage.CHOOSING_QUESTION);
            break;
        }
        case Stage.ROUND_ENDED:
        case Stage.FINAL_ROUND_STARTED:
        case Stage.CHOOSING_QUESTION: {
            if (store.answeringPlayer?.answer.isCorrect)
                hostText = 'Правильно!\n';

            if (store.stage === Stage.ROUND_ENDED) {
                hostText += 'Раунд закончен.';
                hostImageURL = gameSessionService.getHostImageUrl(Stage.ROUND_STARTED);
            } else if (store.stage === Stage.FINAL_ROUND_STARTED) {
                hostText += 'Впереди финальный раунд.';
                hostImageURL = gameSessionService.getHostImageUrl(Stage.ROUND_STARTED);
            } else if (!store.isNoMoreQuestions) {
                hostText += `${store.currentPlayer.nickname}, выбирайте вопрос.`;
                hostImageURL = gameSessionService.getHostImageUrl(Stage.CHOOSING_QUESTION);
            }
            break;
        }
        case Stage.ANSWERING: {
            const themeName = store.currentRound.themes[store.currentQuestionIndexes.theme].name;
            const value = store.currentQuestion.value;
            hostText = `${themeName} за ${value}`;
            hostImageURL = gameSessionService.getHostImageUrl(Stage.ANSWERING);

            if (store.answeringPlayer)
                if (!store.answeringPlayer.answer.isCorrect) {
                    hostText = 'Неверно.';
                    hostImageURL = gameSessionService.getHostImageUrl('wrong');
                }
            break;
        }
        case Stage.FINAL_ROUND: {
            hostImageURL = gameSessionService.getHostImageUrl(Stage.FINAL_ROUND);
            hostText = 'Финальный раунд';
            break;
        }
        case Stage.END_GAME: {
            const winner = store.players.reduce((a, b) => a.score > b.score ? a : b);
            hostText = `Победил ${winner.nickname}!`;
            hostImageURL = gameSessionService.getHostImageUrl(Stage.END_GAME);
            break;
        }
        default: {
            hostText = '';
            hostImageURL = gameSessionService.getHostImageUrl(Stage.WAITING);
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
    const {gameSessionStore: store} = useStore();
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
            case Stage.ROUND_ENDED: {
                setScreenText('');
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
                gameSessionService.chooseQuestion(themeIndex, questionIndex);
            }}
        >
            {question.value}
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
    const {gameSessionStore: store} = useStore();
    return (
        store.stage === Stage.CHOOSING_QUESTION
            ? <RoundTable
                key='table'
                themes={store.currentRound.themes}
            />
            : <QuestionScreen
                key='question'
            />
    )
});

const PlayerCard = observer(({player}) => {
    const {gameSessionStore: store} = useStore();
    const [answer, setAnswer] = useState('');
    let tooltipRef;

    function wait() {
        setTimeout(ReactTooltip.hide, 3000, tooltipRef);
    }

    useEffect(() => {
        if (store.answeringPlayer === player ||
            (store.stage === Stage.END_GAME && player.answer)) {
            setAnswer(player.answer.text);
            ReactTooltip.show(tooltipRef);

            wait()
        }
    }, [player.answer])

    return (
        <>
            <div
                className='player-card'
                data-tip
                data-for={player.nickname + '_tooltip'}
                ref={ref => tooltipRef = ref}
            >
                <img
                    src={gameSessionService.getAvatarUrl()}
                    alt={player.nickname}
                />
                <div>{player.nickname}</div>
                <div>{player.score}</div>
            </div>
            <ReactTooltip
                className='tooltip'
                id={player.nickname + '_tooltip'}
                effect='solid'
                delayHide={3000}
                event='null'
                getContent={() => answer}
            >
            </ReactTooltip>
        </>
    )
});

const Players = observer(() => {
    const {gameSessionStore: store} = useStore();

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
    const {gameSessionStore: store} = useStore();
    const history = useHistory();

    useEffect(() => {
        document.title = 'Игра';

        let listener;

        gameSessionService.getGameState()
            .then(response => {
                store.initialize(response.data);
                listener = new GameSessionListener(listenerUrls.gameSession);
                listener.setHandler(store.eventHandler);
            })
            .catch(() => {
                history.push('/games');
            })

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
            case Stage.TIMEOUT:
                wait(() => {
                    const nextStage = store.isNoMoreQuestions ? Stage.ROUND_ENDED : Stage.CHOOSING_QUESTION
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