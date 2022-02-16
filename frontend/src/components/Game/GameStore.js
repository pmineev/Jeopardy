import {applySnapshot, getSnapshot, types} from "mobx-state-tree";

import {Stage} from "../../common/utils";

const Answer = types
    .model({
        text: '',
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
        question: types.reference(Question),
        text: types.string,
        themeIndex: types.integer,
        questionIndex: types.integer
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
        stage: types.optional(types.enumeration('stage', Object.values(Stage)), Stage.WAITING),
        players: types.array(Player),
        currentPlayer: types.maybe(types.reference(Player)),
        currentRound: types.maybe(Round),
        currentQuestion: types.maybe(CurrentQuestion),
        finalRound: types.maybe(FinalRound),
        answeringPlayer: types.maybe(types.reference(Player)),
        correctAnswer: types.maybe(types.string)
    })
    .actions(self => ({
        eventHandler(event, data) {
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
                player.isPlaying = true;
            else
                self.players.push({...data});  // TODO добавлять в алфавитном порядке
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
            self.setCurrentRound(data.round);
            self.setCurrentPlayer(data.currentPlayer.nickname);

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
            player.answer = Answer.create({...data.answer})

            if (player.answer.isCorrect) {
                self.currentQuestion.setIsAnswered();

                self.currentPlayer = player;

                self.stage = Stage.CORRECT_ANSWER;
            }

            console.log("answered", getSnapshot(self));
        },
        onQuestionTimeout(data) {
            self.currentQuestion.setIsAnswered();
            self.correctAnswer = data.answer;
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
                self.setFinalRound(data.finalRound);

            console.log("inited", getSnapshot(self))

        },
        setStage(stage) {
            self.stage = stage;
        },
        addPlayer(data) {
            console.log(data)
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
            console.log("setCurrentRound", getSnapshot(self))
        },
        setCurrentPlayer(nickname) {
            console.log(nickname)
            self.currentPlayer = self.players.find(player => player.nickname === nickname);
        },
        setCurrentQuestion(data) {
            const currentQuestion = self.currentRound
                .themes[data.themeIndex]
                .questions[data.questionIndex];
            self.currentQuestion = CurrentQuestion.create({
                question: currentQuestion,
                ...data
            });
        },
        setFinalRound(data) {
            self.finalRound = FinalRound.create({...data});
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

export default GameStore;