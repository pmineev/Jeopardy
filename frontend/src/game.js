import './game.css';
import './round.css';

import {useEffect, useState} from "react";
import {observer} from "mobx-react-lite";
import {useHistory} from "react-router-dom";
import {Field, Form, Formik} from "formik";
import ReactTooltip from 'react-tooltip';

import Notifier from "./notifiers";
import {GameSessionService} from "./services";
import {State} from "./utils";
import {useStore} from "./stores/RootStore";


const gameSessionService = new GameSessionService();

const PlayerControls = observer(() => {
    const {gameSessionStore: store} = useStore();
    const history = useHistory();

    return (
        <div className='player-controls'>
            <Formik
                initialValues={{
                    answer: '',
                }}
                onSubmit={(values, {setSubmitting, resetForm}) => {
                    if (values.answer?.length > 0) {
                        gameSessionService.submitAnswer(store.id, values.answer);
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
                    gameSessionService.leave(store.id);
                    history.push('/games');
                }}
            >
                Выйти из игры
            </button>
        </div>
    )
});

const HostCard = observer(() => {
    const {gameSessionStore: store} = useStore();
    let hostText = '';
    let hostImageURL;

    switch (store.state) {
        case State.WAITING: {
            hostText = 'ожидаем игроков';
            hostImageURL = gameSessionService.getHostImageUrl(State.WAITING);
            break;
        }
        case State.ROUND_ENDED:
        case State.FINAL_ROUND_STARTED:
        case State.CHOOSING_QUESTION:
        case State.TIMEOUT: {
            if (store.state === State.TIMEOUT)
                hostText = `Правильный ответ: ${store.currentAnswer.text}. `
            else if (store.currentAnswer?.isCorrect)
                hostText = 'Правильно! ';

            if (store.state === State.ROUND_ENDED) {
                hostText += 'Раунд закончен.';
                hostImageURL = gameSessionService.getHostImageUrl(State.ROUND_STARTED);
            } else if (store.state === State.FINAL_ROUND_STARTED) {
                hostText += 'Впереди финальный раунд.';
                hostImageURL = gameSessionService.getHostImageUrl(State.ROUND_STARTED);
            } else {
                hostText += `${store.currentPlayer.nickname}, выбирайте вопрос.`;
                hostImageURL = gameSessionService.getHostImageUrl(State.CHOOSING_QUESTION);
            }
            break;
        }
        case State.ANSWERING: {
            const themeName = store.currentRound.themes[store.currentQuestionIndexes.theme].name;
            const value = store.currentQuestion.value;
            hostText = `${themeName} за ${value}`;
            hostImageURL = gameSessionService.getHostImageUrl(State.ANSWERING);

            if (store.currentAnswer?.text.length > 0) {
                hostText = 'Неверно.';
                hostImageURL = gameSessionService.getHostImageUrl('wrong');
            }
            break;
        }
        case State.FINAL_ROUND: {
            hostImageURL = gameSessionService.getHostImageUrl(State.FINAL_ROUND);
            hostText = 'Финальный раунд';
            break;
        }
        case State.END_GAME: {
            const winner = store.players.reduce((a, b) => a.score > b.score ? a : b);
            hostText = `Победил ${winner.nickname}!`;
            hostImageURL = gameSessionService.getHostImageUrl(State.END_GAME);
            break;
        }
        default: {
            hostText = '';
            hostImageURL = gameSessionService.getHostImageUrl(State.WAITING);
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

    return (
        <div className='question'>
            {
                ([State.ROUND_STARTED, State.ROUND_ENDED, State.FINAL_ROUND_STARTED, State.WAITING].includes(store.state))
                    ? store.roundText
                    : store.currentQuestion.text
            }
        </div>
    )
});

const QuestionCell = observer(({question, theme_order, question_order}) => {
    const {gameSessionStore: store} = useStore();
    const [clicked, setClicked] = useState(false);

    return (
        <td className={`question-cell ${question.isAnswered ? 'empty' : ''} ${clicked ? 'clicked' : ''}`}
            onClick={() => {
                setClicked(true);
                gameSessionService.chooseQuestion(store.id, theme_order, question_order);
            }}
        >
            {question.value}
        </td>
    )
});

const Theme = ({theme, theme_order}) => {
    return (
        <tr>
            <td>
                {theme.name}
            </td>
            {theme.questions.map((question, index) =>
                <QuestionCell
                    key={question.value}
                    theme_order={theme_order}
                    question={question}
                    question_order={index}
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
                        theme_order={index}
                    />
                )}
            </tbody>
        </table>
    )
}

const GameScreen = observer(() => {
    const {gameSessionStore: store} = useStore();
    return (
        [State.CHOOSING_QUESTION, State.TIMEOUT].includes(store.state)
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
        if (store.currentAnswer?.text.length > 0
            && store.currentPlayer?.nickname === player.nickname) {
            setAnswer(store.currentAnswer.text);
            ReactTooltip.show(tooltipRef);

            wait();
        }

    }, [store.currentAnswer])

    useEffect(() => {
        if (player.answer) {
            setAnswer(player.answer);
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

        let gameSessionId;
        let notifier;

        if (!store.id) {
            gameSessionService.getId()
                .then(response => {
                    gameSessionId = response.data.id;

                    gameSessionService.getGameState(gameSessionId)
                        .then(r => {
                            store.initializeJoined(r.data);
                            store.setId(gameSessionId);
                        });

                    notifier = new Notifier('game', gameSessionId);
                    notifier.setListener(store.listener);

                })
                .catch(error => {
                    if (error.response.data.detail === 'not player')
                        history.push('/games');
                })

        }

        return () => {
            notifier?.close();
        }
    }, [store]);

    useEffect(() => {
        function wait(state) {
            setTimeout(store.setState, 5000, state);
        }

        if (store.state === State.ROUND_ENDED)
            wait(State.ROUND_STARTED)
        else if (store.state === State.ROUND_STARTED) {
            store.clearCurrentAnswer();
            wait(State.CHOOSING_QUESTION)
        } else if (store.state === State.FINAL_ROUND_STARTED)
            wait(State.FINAL_ROUND)
    }, [store, store.state]);

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