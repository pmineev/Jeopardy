export const notifierUrls = {
    lobby: 'ws://127.0.0.1:8000/ws/lobby/',
    gameSession: 'ws://127.0.0.1:8000/ws/game_session/'
}

export class Notifier {
    constructor(url) {
        this.url = url;
        this.listener = null;

        this.ws = new WebSocket(this.url);
    }

    setListener(listener) {
        this.listener = listener;

        this.ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            console.log('ws', data);
            this.listener(data.event, data.data);
        }
    }

    close() {
        console.log('ws close');
        this.ws.close();
    }

}

export class GameSessionNotifier extends Notifier {
    constructor(url) {
        super(url);
        this.ws.onopen = () => {
            const username = localStorage.getItem("username");
            this.ws.send(JSON.stringify({username}));
        }


    }
}
