const State = Object.freeze({
    WAITING: 0,
    ROUND_STARTED: 1,
    CHOOSING_QUESTION: 2,
    ANSWERING: 3,
    TIMEOUT: 4,
    ROUND_ENDED: 5,
    FINAL_ROUND_STARTED: 6,
    FINAL_ROUND: 7,
    END_GAME: 8
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

export {State, toOrdinal}