const listenerUrls = {
    lobby: 'ws://127.0.0.1:8000/ws/lobby/',
    gameSession: 'ws://127.0.0.1:8000/ws/game_session/'
}

class Listener {
    constructor(url) {
        this.url = url;
        this.handler = null;

        this.ws = new WebSocket(this.url);
    }

    setHandler(handler) {
        this.handler = handler;

        this.ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            console.log('ws', data);
            this.handler(data.event, data.data);
        }
    }

    close() {
        console.log('ws close');
        this.ws.close();
    }

}

export {listenerUrls, Listener};