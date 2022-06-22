import {API_HOST} from "./services";

const listenerUrls = {
    lobby: `ws://${API_HOST}/ws/lobby/`,
    gameSession: `ws://${API_HOST}/ws/game_session/`
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
            this.handler(data.event, data.data);
        }
    }

    close() {
        this.ws.close();
    }

}

export {listenerUrls, Listener};
