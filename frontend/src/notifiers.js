class Notifier {
    constructor(type, id = '') {
        this.url = Notifier.createUrl(type, id);
        this.listener = null;

        this.ws = new WebSocket(this.url);
    }

    static createUrl(type, id) {
        switch (type) {
            case 'lobby':
                return 'ws://127.0.0.1:8000/ws/lobby/'
            case 'game':
                return `ws://127.0.0.1:8000/ws/game_sessions/${id}/`
            default:
                throw new Error('нет такого типа уведомлений')
        }
    }

    setListener(listener) {
        this.listener = listener;

        this.ws.onmessage = (message) => {
            const data = JSON.parse(message.data);

            this.listener([data.event, data.data]);
        }
    }

}

export default Notifier;