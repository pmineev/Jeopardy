import {types} from "mobx-state-tree";

import {questionValues} from "../utils";

const Question = types
    .model({
        id: types.identifier,
        value: types.number,
        text: types.maybe(types.string),
        answer: types.maybe(types.string)
    })
    .actions(self => ({
        set(text, answer) {
            self.text = text;
            self.answer = answer
        }
    }))
    .views(self => ({
        get isSet() {
            return !!self.text;
        }
    }));

const Theme = types
    .model({
        name: types.string,
        questions: types.array(Question)
    });

const Round = types
    .model({
        id: types.identifier,
        themes: types.array(Theme),
        questionValues: types.array(types.number)
    })
    .actions(self => ({
        addTheme(name) {
            self.themes.push(Theme.create({
                name,
                questions: self.questionValues.map(value => (
                    Question.create({
                        id: self.id.toString() + name + value.toString(),
                        value
                    })
                ))
            }))
        }
    }))
    .views(self => ({
        get index() {
            return Number(self.id.slice(self.id.lastIndexOf('_') + 1));
        }
    }));

const AddGameStore = types
    .model({
        name: types.maybe(types.string),
        roundsCount: types.maybe(types.number),
        questionsCount: types.maybe(types.number),
        rounds: types.array(Round),
        finalRound: types.maybe(Question),
        selectedRound: types.maybe(types.reference(Round)),
        selectedQuestion: types.maybe(types.reference(Question))
    })
    .actions(self => ({
        setGameParams(name, roundsCount, questionsCount) {
            self.name = name;
            self.roundsCount = roundsCount;
            self.questionsCount = questionsCount;

            for (let i = 0; i < self.roundsCount - 1; i++) {
                self.rounds[i] = Round.create({
                    id: self.name + '_' + i.toString(),
                    questionValues: questionValues
                        .slice(0, self.questionsCount)
                        .map(value => value * (i + 1))
                })
            }

            self.finalRound = Question.create({
                id: 'final',
                value: 200 * self.roundsCount * self.questionsCount
            })

            self.selectedRound = self.rounds[0];
        },
        setSelectedQuestion(question) {
            self.selectedQuestion = question;
        },
        previousRound() {
            self.selectedRound = self.rounds[self.selectedRound.index - 1];
        },
        nextRound() {
            self.selectedRound = self.rounds[self.selectedRound.index + 1];
        },
        setFinalRound(text, answer) {
            self.finalRound.set(text, answer)
        },
        clear() {
            self.name = undefined;
            self.roundsCount = undefined;
            self.roundsCount = undefined;
            self.rounds = [];
            self.finalRound = undefined;

        }
    }))
    .views(self => ({
        get isAllRoundsFilled() {
            for (const round of self.rounds) {
                if (round.themes.length === 0) {
                    return false;
                }
            }
            return true;
        },
        get isAllQuestionsFilled() {
            for (const round of self.rounds) {
                for (const theme of round.themes) {
                    for (const question of theme.questions) {
                        if (!question.isSet) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
    }));

export default AddGameStore;