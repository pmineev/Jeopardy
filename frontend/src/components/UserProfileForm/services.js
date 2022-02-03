import axios from "axios";

class UserProfileService {
    get(username) {
        const url = `/users/${username}/`;
        return axios.get(url);
    }

    save(username, nickname, password) {
        const url = `/users/${username}/`;

        let data = {};
        if (nickname && nickname.length > 0)
            data.nickname = nickname
        if (password && password.length > 0)
            data.password = password

        return axios.patch(url, data);
    }
}

export {UserProfileService};