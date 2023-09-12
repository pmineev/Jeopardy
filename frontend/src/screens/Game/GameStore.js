import {reaction, when} from "mobx";
import {applySnapshot, getSnapshot, onAction, types} from "mobx-state-tree";

import {Stage, toOrdinal} from "../../common/utils";
import {getHostImageUrl} from "./services";
import {getNickname} from "../../common/auth/services";

const Answer = types
    .model({
        text: types.maybeNull(types.string),
        isCorrect: types.maybeNull(types.boolean)
    });

const Player = types
    .model({
        nickname: types.identifier,
        score: 0,
        isPlaying: true,
        answer: types.maybe(Answer)
    });

const FinalRound = types
    .model({
        text: types.string,
        value: types.number,
        answer: types.maybe(types.string)
    });

const Question = types
    .model({
        id: types.identifier,
        value: types.integer,
        isAnswered: types.boolean
    });

const CurrentQuestion = types
    .model({
        question: types.maybe(types.reference(Question)),
        text: types.string,
        answer: types.maybe(types.string),
        themeIndex: types.maybeNull(types.integer),
        questionIndex: types.maybeNull(types.integer)
    })
    .actions(self => ({
        setIsAnswered() {
            self.question.isAnswered = true;
        }
    }))
    .views(self => ({
        get value() {
            return self.question.value;
        }
    }));

const Theme = types
    .model({
        name: types.string,
        questions: types.array(Question)
    });

const Round = types
    .model({
        order: types.integer,
        themes: types.array(Theme)
    });

const GameStore = types
    .model({
        maxPlayers: types.maybe(types.integer),
        stage: types.optional(types.enumeration('stage', Object.values(Stage)), Stage.EMPTY),
        host: types.maybe(types.string),
        hostText: '',
        screenText: '',
        hostImageURL: getHostImageUrl(Stage.WAITING),
        players: types.array(Player),
        currentPlayer: types.maybe(types.reference(Player)),
        currentRound: types.maybe(Round),
        currentQuestion: types.maybe(CurrentQuestion),
        finalRound: types.maybe(FinalRound),
        answeringPlayer: types.maybe(types.reference(Player)),
        correctAnswer: types.maybe(types.string)
    })
    .actions(self => {
        let disposers = [];
        return {
            afterCreate() {
                let disposer;
                disposer = reaction(
                    () => self.stage,
                    stage => {
                        switch (stage) {
                            case Stage.WAITING: {
                                self.hostImageURL = getHostImageUrl(Stage.WAITING);
                                // TODO изменять текст при возможности начать игру
                                self.hostText = `Ожидаем игроков...`;
                                break;
                            }
                            case Stage.CORRECT_ANSWER: {
                                self.hostImageURL = getHostImageUrl(Stage.ANSWERING);
                                self.hostText = 'Правильно!';
                                break;
                            }
                            case Stage.TIMEOUT: {
                                self.hostImageURL = getHostImageUrl(Stage.CHOOSING_QUESTION);
                                self.hostText = `Правильный ответ: ${self.currentQuestion.answer}. `
                                break;
                            }
                            case Stage.ROUND_ENDED: {
                                self.hostImageURL = getHostImageUrl(Stage.ROUND_STARTED);
                                self.hostText += 'Раунд закончен.';
                                break;
                            }
                            case Stage.FINAL_ROUND_STARTED: {
                                self.hostImageURL = getHostImageUrl(Stage.ROUND_STARTED);
                                self.hostText += '';
                                break;
                            }
                            case Stage.CHOOSING_QUESTION: {
                                self.hostImageURL = getHostImageUrl(Stage.CHOOSING_QUESTION);
                                self.hostText += `${self.currentPlayer.nickname}, выбирайте вопрос.`;
                                break;
                            }
                            case Stage.READING_QUESTION: {
                                self.hostImageURL = getHostImageUrl(Stage.ANSWERING);

                                const themeName = self.currentRound.themes[self.currentQuestion.themeIndex].name;
                                const value = self.currentQuestion.value;
                                self.hostText = `${themeName} за ${value}.`;
                                break;
                            }
                            case Stage.ANSWERING: {
                                if (self.host !== getNickname()) {
                                    self.hostImageURL = getHostImageUrl(Stage.ANSWERING);
                                    const themeName = self.currentRound.themes[self.currentQuestion.themeIndex].name;
                                    const value = self.currentQuestion.value;
                                    self.hostText = `${themeName} за ${value}.`;
                                }

                                break;
                            }
                            case Stage.PLAYER_ANSWERING: {
                                self.hostImageURL = getHostImageUrl(Stage.ANSWERING);
                                if (self.host !== getNickname()) {
                                    const themeName = self.currentRound.themes[self.currentQuestion.themeIndex].name;
                                    const value = self.currentQuestion.value;
                                    self.hostText = `${themeName} за ${value}.`;
                                }
                                break;
                            }
                            case Stage.FINAL_ROUND_ANSWERING: {
                                self.hostImageURL = getHostImageUrl(Stage.ANSWERING);
                                self.hostText = '';
                                break;
                            }
                            case Stage.FINAL_ROUND: {
                                self.hostImageURL = getHostImageUrl(Stage.FINAL_ROUND);
                                self.hostText = 'Финальный раунд.';
                                break;
                            }
                            case Stage.FINAL_ROUND_ENDED: {
                                self.hostImageURL = getHostImageUrl(Stage.FINAL_ROUND);
                                break;
                            }
                            case Stage.END_GAME: {
                                self.hostImageURL = getHostImageUrl(Stage.END_GAME);
                                break;
                            }
                            default: {
                                self.hostImageURL = getHostImageUrl(Stage.WAITING);
                                self.hostText = '';
                            }
                        }
                    });
                disposers.push(disposer);

                disposer = reaction(
                    () => self.currentQuestion?.answer,
                    () => {
                        if (self.host === getNickname())
                            switch (self.stage) {
                                case Stage.ANSWERING:
                                case Stage.PLAYER_ANSWERING:
                                case Stage.WRONG_ANSWER:
                                case Stage.FINAL_ROUND_ANSWERING:
                                    self.hostText = `Правильный ответ: ${self.currentQuestion.answer}.`
                            }
                    }
                );
                disposers.push(disposer);

                disposer = reaction(
                    () => self.stage === Stage.WRONG_ANSWER,
                    () => {
                        if (self.host !== getNickname() && self.stage === Stage.WRONG_ANSWER) {
                            self.hostText = 'Неверно.';
                            self.hostImageURL = getHostImageUrl('wrong');
                        }
                    }
                );
                disposers.push(disposer);

                disposer = reaction(
                    () => self.stage + self.answeringPlayer,
                    () => {
                        if (self.stage === Stage.FINAL_ROUND_ENDED && self.answeringPlayer) {
                            if (self.host === getNickname())
                                self.hostText = `Правильный ответ: ${self.currentQuestion.answer}.\n`
                            else
                                self.hostText = '';

                            self.hostText += `Ответ игрока ${self.answeringPlayer.nickname}: `
                                + `${self.answeringPlayer.answer?.text ?? '<нет ответа>'}`
                        }
                    }
                );
                disposers.push(disposer);

                disposer = reaction(
                    () => self.finalRound?.answer,
                    () => {
                        if (self.stage === Stage.END_GAME && self.finalRound?.answer) {
                            // TODO несколько победителей при равенстве счета
                            const winner = self.players.reduce((a, b) => a.score > b.score ? a : b);
                            self.hostText = `Правильный ответ: ${self.finalRound.answer}.\nПобедил ${winner.nickname}!`;
                        }
                    }
                );
                disposers.push(disposer);

                disposer = reaction(
                    () => self.stage,
                    stage => {
                        switch (stage) {
                            case Stage.ROUND_STARTED: {
                                self.screenText = toOrdinal(self.currentRound.order) + ' раунд';
                                break;
                            }
                            case Stage.FINAL_ROUND_STARTED: {
                                self.screenText = 'Финальный раунд';
                                break;
                            }
                            case Stage.READING_QUESTION:
                            case Stage.ANSWERING:
                            case Stage.PLAYER_ANSWERING: {
                                self.screenText = self.currentQuestion.text;
                                break;
                            }
                            case Stage.FINAL_ROUND:
                            case Stage.FINAL_ROUND_ANSWERING: {
                                self.screenText = self.finalRound.text;
                                break;
                            }
                            default:
                                self.screenText = '';
                        }
                    }
                );
                disposers.push(disposer);
                onAction(self, call => console.log(call, getSnapshot(self)), true)
            },
            beforeDestroy() {
              disposers.forEach(d => d())
            },
            eventHandler(event, data) {

                const handlers = {
                    'player_joined': self.onPlayerJoined,
                    'player_left': self.onPlayerLeft,
                    'current_player_chosen': self.onCurrentPlayerChosen,
                    'round_started': self.onRoundStarted,
                    'current_question_chosen': self.onCurrentQuestionChosen,
                    'answers_allowed': self.onAnswersAllowed,
                    'player_answering': self.onPlayerAnswering,
                    'player_answered': self.onPlayerAnswered,
                    'question_timeout': self.onQuestionTimeout,
                    'final_round_started': self.onFinalRoundStarted,
                    'final_round_timeout': self.onFinalRoundTimeout,
                    'game_ended': self.onGameEnded,
                };

                handlers[event](data);
            },
            onPlayerJoined(data) {
                const player = self.players.find(player => player.nickname === data.nickname);

                if (player)
                    player.isPlaying = true;
                else {
                    self.players.push({...data});
                    self.players.sort((p1, p2) => p1.nickname > p2.nickname);
                }

            },
            onPlayerLeft(data) {
                const playerIndex = self.players.findIndex(player => player.nickname === data.nickname);

                if (self.stage === Stage.WAITING)
                    self.players.splice(playerIndex, 1);
                else
                    self.players[playerIndex].isPlaying = false;
            },
            onCurrentPlayerChosen(data) {
                self.setCurrentPlayer(data.nickname);
            },
            onRoundStarted(data) {
                self.currentQuestion = undefined;

                self.setCurrentRound(data.round);
                self.setCurrentPlayer(data.currentPlayer.nickname);

                if (self.stage === Stage.WAITING)
                    self.stage = Stage.ROUND_STARTED;
            },
            onCurrentQuestionChosen(data) {
                self.clearAnswers();

                self.setCurrentQuestion(data);

                self.stage = self.host ? Stage.READING_QUESTION : Stage.ANSWERING;
            },
            onAnswersAllowed(data) {
                self.stage = self.stage === Stage.READING_QUESTION ? Stage.ANSWERING : Stage.FINAL_ROUND_ANSWERING
            },
            onPlayerAnswered(data) {
                const player = self.players.find(player => player.nickname === data.nickname);

                player.score = data.score;
                player.answer = Answer.create({...data.answer})

                if (self.stage === Stage.ANSWERING || self.stage === Stage.PLAYER_ANSWERING) {
                    self.answeringPlayer = player;

                    if (player.answer.isCorrect) {
                        self.currentQuestion.setIsAnswered();

                        self.currentPlayer = player;

                        self.stage = Stage.CORRECT_ANSWER;
                    }
                    else
                        self.stage = Stage.WRONG_ANSWER;
                }
                else {
                    const notCheckedPlayers = self.players.filter(player => player.answer.isCorrect === null)
                    console.log(notCheckedPlayers)
                    if (notCheckedPlayers.length > 0)
                        self.answeringPlayer = notCheckedPlayers.reduce((p1, p2) => p1.score > p2.score ? p1 : p2)
                    else {
                        self.answeringPlayer = undefined;
                        self.stage = Stage.END_GAME;
                    }
                }
            },
            onPlayerAnswering(data) {
                if (self.stage === Stage.ANSWERING) {
                    // TODO отображать отвечающего игрока
                    self.stage =  Stage.PLAYER_ANSWERING;
                }
                else {
                    self.answeringPlayer = self.players.find(player => player.nickname === data.nickname);
                }
            },
            onQuestionTimeout(data) {
                self.currentQuestion.setIsAnswered();
                self.currentQuestion.answer = data.answer;
                self.stage = Stage.TIMEOUT;
            },
            onFinalRoundStarted(data) {
                self.finalRound = FinalRound.create({...data})
            },
            onFinalRoundTimeout(data) {
                self.players.forEach(player => {
                    const playerData = data.players.find(pd => pd.nickname === player.nickname);
                    player.score = playerData.score;
                    player.answer = Answer.create({...playerData.answer});
                })

                if (self.host) {
                    self.stage = Stage.FINAL_ROUND_ENDED
                }
                else {
                    self.finalRound.answer = data.answer

                    self.stage = Stage.END_GAME;
                }
            },
            onGameEnded(data) {
                self.finalRound.answer = data.answer
            },
            initialize(data) {
                self.clear();

                self.maxPlayers = data.maxPlayers;
                self.stage = data.stage;
                if (data.host)
                    self.host = data.host;
                data.players.forEach(playerData =>
                    self.addPlayer(playerData)
                );
                if (data.currentRound)
                    self.setCurrentRound(data.currentRound);
                if (data.currentPlayer) {
                    if (self.stage === Stage.FINAL_ROUND_ENDED) {
                        self.answeringPlayer = self.players.find(player =>
                            player.nickname === data.currentPlayer);
                    }
                    else
                        self.setCurrentPlayer(data.currentPlayer);
                }
                if (data.currentQuestion)
                    self.setCurrentQuestion(data.currentQuestion);
                if (data.finalRound)
                    self.setFinalRound(data.finalRound);

            },
            setStage(stage) {
                self.stage = stage;
            },
            addPlayer(data) {
                self.players.push(Player.create({...data}));
            },
            setCurrentRound(data) {
                self.currentRound = Round.create({
                    order: data.order,
                    themes: data.themes.map(theme => (
                        Theme.create({
                            name: theme.name,
                            questions: theme.questions.map(question => (
                                Question.create({
                                    id: theme.name + question.value,
                                    value: question.value,
                                    isAnswered: question.isAnswered
                                })
                            ))
                        })
                    ))
                });
            },
            setCurrentPlayer(nickname) {
                self.currentPlayer = self.players.find(player => player.nickname === nickname);
            },
            setCurrentQuestion(data) {
                const currentQuestion = data.themeIndex !== null
                    ? self.currentRound
                        .themes[data.themeIndex]
                        .questions[data.questionIndex]
                    : undefined;
                self.currentQuestion = CurrentQuestion.create({
                    question: currentQuestion,
                    ...data
                });
            },
            setCorrectAnswer(data) {
                self.currentQuestion.answer = data.answer;
            },
            setFinalRound(data) {
                self.finalRound = FinalRound.create({...data});
            },
            clearAnswers() {
                self.answeringPlayer = undefined;
                self.players.forEach(player => {
                    player.answer = undefined;
                })
            },
            clear() {
                applySnapshot(self, {});
            }
        }
    })
    .views(self => ({
        get isNoMoreQuestions() {
            return self.currentRound.themes.every(theme =>
                theme.questions.every(question =>
                    question.isAnswered
                )
            )
        },
        get isInitialized() {
            return self.stage !== Stage.EMPTY
        },
        get isAllPlayersJoined() {
            return self.players.length === self.maxPlayers
        }
    }));

export default GameStore;