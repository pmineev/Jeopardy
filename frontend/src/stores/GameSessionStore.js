import {applySnapshot, getSnapshot, types} from "mobx-state-tree";
import {Stage, toOrdinal} from "../utils";

const Answer = types
    .model({
        text: '',
        isCorrect: types.maybe(types.boolean)
    });

const Player = types
    .model({
        nickname: types.identifier,
        score: 0,
        isPlaying: true,
        answer: types.maybe(Answer)
    })
    .actions(self => ({
        setIsPlaying(isPlaying) {
            self.isPlaying = isPlaying;
        }
    }));

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
        text: types.maybe(types.string),
        isAnswered: types.boolean
    })
    .actions(self => ({
        setText(text) {
            self.text = text;
        }
    }));

const CurrentQuestionIndexes = types
    .model({
        theme: types.number,
        question: types.number
    });

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

const GameSessionStore = types
    .model({
        stage: types.optional(types.enumeration('stage', Object.values(Stage)), Stage.WAITING),
        players: types.array(Player),
        currentPlayer: types.maybe(types.reference(Player)),
        currentRound: types.maybe(Round),
        currentQuestion: types.maybe(types.safeReference(Question)),
        currentQuestionIndexes: types.optional(CurrentQuestionIndexes, {
            theme: -1,
            question: -1
        }),
        finalRound: types.maybe(FinalRound),
        answeringPlayer: types.maybe(types.reference(Player)),
        correctAnswer: types.maybe(types.string),
        roundText: ''

    })
    .actions(self => ({
        listener(event, data) {
            console.log("listener", event, getSnapshot(self), data);

            const handlers = {
                'player_joined': self.onPlayerJoined,
                'player_left': self.onPlayerLeft,
                'current_player_chosen': self.onCurrentPlayerChosen,
                'round_started': self.onRoundStarted,
                'current_question_chosen': self.onCurrentQuestionChosen,
                'player_answered': self.onPlayerAnswered,
                'question_timeout': self.onQuestionTimeout,
                'final_round_started': self.onFinalRoundStarted,
                'final_round_timeout': self.onFinalRoundTimeout,
            };

            handlers[event](data);
        },
        onPlayerJoined(data) {
            const player = self.players.find(player => player.nickname === data.nickname);

            if (player)
                player.setIsPlaying(true);
            else
                self.players.push({
                    nickname: data.nickname
                });
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
            console.log(data);
            self.setCurrentRound(data);
            self.roundText = toOrdinal(self.currentRound.order) + ' раунд';

            if (self.stage === Stage.WAITING)
                self.stage = Stage.ROUND_STARTED;
        },
        onCurrentQuestionChosen(data) {
            self.clearAnswers();

            self.setCurrentQuestion(data);

            self.stage = Stage.ANSWERING;
        },
        onPlayerAnswered(data) {
            const player = self.players.find(player => player.nickname === data.nickname);

            self.answeringPlayer = player;

            player.score = data.score;
            player.answer = Answer.create({
                text: data.answer.text,
                isCorrect: data.answer.isCorrect
            })

            if (player.answer.isCorrect) {
                self.currentQuestion.isAnswered = true;

                self.currentPlayer = player;

                self.stage = self.isNoMoreQuestions ? Stage.ROUND_ENDED : Stage.CHOOSING_QUESTION
            }

            console.log("answered", getSnapshot(self));
        },
        onQuestionTimeout(data) {
            self.currentQuestion.isAnswered = true;
            self.correctAnswer = data.answer;
            self.stage = Stage.TIMEOUT;
        },
        onFinalRoundStarted(data) {
            self.finalRound = FinalRound.create({
                text: data.text,
                value: data.value
            })

            self.roundText = 'Финальный раунд';
        },
        onFinalRoundTimeout(data) {
            self.players.forEach(player => {
                const playerData = data.players.find(pd => pd.nickname === player.nickname);
                player.score = playerData.score;
                player.answer = Answer.create({
                    text: playerData.answer.text,
                    isCorrect: playerData.answer.isCorrect
                });
            })

            self.finalRound.answer = data.answer

            self.stage = Stage.END_GAME;
        },
        initialize(data) {
            self.clear();

            console.log("init", data)
            self.stage = data.stage;
            data.players.forEach(playerData =>
                self.addPlayer(playerData)
            );
            if (data.currentRound)
                self.setCurrentRound(data.currentRound);
            if (data.currentPlayer)
                self.setCurrentPlayer(data.currentPlayer);
            if (data.currentQuestion)
                self.setCurrentQuestion(data.currentQuestion);
            if (data.finalRound)
                self.setCurrentQuestion(data.finalRound);

            console.log("inited", getSnapshot(self))

        },
        setStage(stage) {
            self.stage = stage;
        },
        addPlayer(data) {
            console.log(data)
            const player = Player.create({
                nickname: data.nickname,
                score: data.score,
                isPlaying: data.isPlaying
            });
            self.players.push(player);
            if (data.answer) {
                player.answer = Answer.create({
                    text: data.answer.text,
                    isCorrect: data.answer.isCorrect !== null ? data.answer.isCorrect : undefined
                });
            }


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
            console.log("setCurrentRound", getSnapshot(self))
        },
        setCurrentPlayer(nickname) {
            console.log(nickname)
            self.currentPlayer = self.players.find(player => player.nickname === nickname);
        },
        setCurrentQuestion(data) {
            self.currentQuestion = self.currentRound
                .themes[data.themeIndex]
                .questions[data.questionIndex];
            self.currentQuestion.setText(data.text);

            self.currentQuestionIndexes.theme = data.themeIndex
            self.currentQuestionIndexes.question = data.questionIndex

        },
        setFinalRound(data) {
            self.finalRound = FinalRound.create({
                text: data.text,
                value: data.value
            });
            if (data.answer)
                self.finalRound.answer = data.answer;
        },
        clearAnswers() {
            self.correctAnswer = undefined;
            self.answeringPlayer = undefined;
            self.players.forEach(player => {
                player.answer = undefined;
                console.log(`cleared ${player.nickname} answer`)
            })
        },
        clear() {
            applySnapshot(self, {});
        }
    }))
    .views(self => ({
        get isNoMoreQuestions() {
            return self.currentRound.themes.every(theme =>
                theme.questions.every(question =>
                    question.isAnswered
                )
            )
        }
    }));

export default GameSessionStore;