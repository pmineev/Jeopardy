import {Listener} from "../../common/listener";

class GameSessionListener extends Listener {
    constructor(url) {
        super(url);
        this.ws.onopen = () => {
            const username = localStorage.getItem("username");
            this.ws.send(JSON.stringify({username}));
        }
    }
}

export default GameSessionListener;