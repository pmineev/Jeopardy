const Stage = Object.freeze({
    EMPTY: 'EMPTY',
    WAITING: 'WAITING',
    ROUND_STARTED: 'ROUND_STARTED',
    CHOOSING_QUESTION: 'CHOOSING_QUESTION',
    READING_QUESTION: 'READING_QUESTION',
    ANSWERING: 'ANSWERING',
    PLAYER_ANSWERING: 'PLAYER_ANSWERING',
    WRONG_ANSWER: 'WRONG_ANSWER',
    CORRECT_ANSWER: 'CORRECT_ANSWER',
    TIMEOUT: 'TIMEOUT',
    ROUND_ENDED: 'ROUND_ENDED',
    FINAL_ROUND_STARTED: 'FINAL_ROUND_STARTED',
    FINAL_ROUND: 'FINAL_ROUND',
    FINAL_ROUND_ANSWERING: 'FINAL_ROUND_ANSWERING',
    FINAL_ROUND_ENDED: 'FINAL_ROUND_ENDED',
    END_GAME: 'END_GAME'
})

function toOrdinal(n) {
    const ordinals = ['Нулевой',
        'Первый',
        'Второй',
        'Третий',
        'Четвертый',
        'Пятый',
        'Шестой',
        'Седьмой',
        'Восьмой',
        'Девятый'
    ]

    return ordinals[n];
}

const questionValues = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

export {Stage, toOrdinal, questionValues}