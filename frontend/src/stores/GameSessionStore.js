import {applySnapshot, types} from "mobx-state-tree";
import {State, toOrdinal} from "../utils";

const Player = types
    .model({
        nickname: types.identifier,
        score: types.integer,
        isPlaying: types.boolean,
        answer: types.maybe(types.string)
    })
    .actions(self => ({
        setIsPlaying(isPlaying) {
            self.isPlaying = isPlaying;
        }
    }));

const Answer = types
    .model({
        text: '',
        isCorrect: false
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
        id: types.maybe(types.number),
        state: types.optional(types.enumeration('state', Object.values(State)), State.WAITING),
        players: types.array(Player),
        currentPlayer: types.maybe(types.reference(Player)),
        currentRound: types.maybe(Round),
        currentQuestion: types.maybe(types.safeReference(Question)),
        currentQuestionIndexes: types.optional(CurrentQuestionIndexes, {
            theme: -1,
            question: -1
        }),
        finalQuestion: types.maybe(Question),
        currentAnswer: types.maybe(Answer),
        roundText: ''

    })
    .actions(self => ({
        listener(event, data) {
            switch (event) {
                case 'player_joined': {
                    const player = self.players.find(player => player.nickname === data.nickname);

                    if (player)
                        player.setIsPlaying(true);
                    else
                        self.players.push({
                            nickname: data.nickname,
                            score: data.score,
                            isPlaying: data.is_playing
                        });

                    break;
                }
                case 'player_left': {
                    const playerIndex = self.players.findIndex(player => player.nickname === data.nickname);

                    if (self.state === State.WAITING)
                        self.players.splice(playerIndex, 1);
                    else
                        self.players[playerIndex].isPlaying = false;

                    break;
                }
                case 'current_player_chosen': {
                    self.setCurrentPlayer(data);

                    break;
                }
                case 'round_started': {
                    console.log(data);
                    self.setCurrentRound(data);
                    self.roundText = toOrdinal(self.currentRound.order + 1) + ' раунд';
                    self.state = self.currentRound.order > 0 ? State.ROUND_ENDED : State.ROUND_STARTED;

                    break;
                }
                case 'current_question_chosen': {
                    self.setCurrentQuestion(data);

                    self.state = State.ANSWERING;

                    break;
                }
                case 'player_answered': {
                    self.currentAnswer = Answer.create({
                        text: data.text,
                        isCorrect: data.is_correct
                    });

                    const player = self.players.find(player => player.nickname === data.player.nickname);

                    self.currentPlayer = player;

                    player.score = data.player.score;

                    if (self.currentAnswer.isCorrect) {
                        self.currentRound
                            .themes[self.currentQuestionIndexes.theme]
                            .questions[self.currentQuestionIndexes.question]
                            .isAnswered = true;


                        if (self.notAnsweredQuestionsCount !== 1)
                            self.state = State.CHOOSING_QUESTION;
                    }

                    break;
                }
                case 'question_timeout': {
                    self.currentQuestion.isAnswered = true;
                    self.currentAnswer = Answer.create({
                        text: data.text,
                        isCorrect: true
                    });
                    self.state = State.TIMEOUT;

                    break;
                }
                case 'final_round_started': {
                    self.finalQuestion = Question.create({
                        id: 'final',
                        value: data.value,
                        text: data.text,
                        isAnswered: false
                    })
                    self.currentQuestion = self.finalQuestion;

                    self.state = State.FINAL_ROUND_STARTED;

                    break;
                }
                case 'final_round_timeout': {
                    self.players.forEach(player => {
                        const playerData = data.players.find(pd => pd.nickname === player.nickname);
                        player.score = playerData.score;
                        player.answer = playerData.answer ?? undefined;
                    })
                    self.state = State.END_GAME;

                    break;
                }
                default:
                    throw new Error('нет такого события');
            }
        },
        initializeCreated(data) {
            self.id = Number(data.id);
            self.players.push({
                nickname: data.players[0].nickname,
                score: data.players[0].score,
                isPlaying: data.players[0].is_playing
            })
        },
        initializeJoined(data) {
            self.clear();

            self.state = data.state;
            data.players.forEach(player =>
                self.players.push({
                    nickname: player.nickname,
                    score: player.score,
                    isPlaying: player.is_playing
                })
            );

            if (data.current_round)
                self.setCurrentRound(data.current_round);
            if (data.current_player)
                self.setCurrentPlayer(data.current_player);
            if (data.current_question)
                self.setCurrentQuestion(data.current_question);
        },
        setState(state) {
            self.state = state;
        },
        setId(id) {
            self.id = id;
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
                                isAnswered: question.is_answered
                            })
                        ))
                    })
                ))
            });
        },
        setCurrentPlayer(data) {
            self.currentPlayer = self.players.find(player => player.nickname === data.nickname);
        },
        setCurrentQuestion(data) {
            if (data) {
                self.currentQuestion = self.currentRound
                    .themes[data.theme_order]
                    .questions[data.question_order];
                self.currentQuestion.setText(data.text);

                self.currentQuestionIndexes.theme = data.theme_order
                self.currentQuestionIndexes.question = data.question_order
            }
        },
        clearCurrentAnswer() {
            self.currentAnswer = undefined;
        },
        clear() {
            applySnapshot(self, {});
        }
    }))
    .views(self => ({
        get notAnsweredQuestionsCount() {
            let notAnswered = 0;

            self.currentRound.themes.forEach(theme => {
                theme.questions.forEach(question => {
                    if (!question.isAnswered)
                        notAnswered++;
                })
            })

            return notAnswered;
        }
    }));

export default GameSessionStore;