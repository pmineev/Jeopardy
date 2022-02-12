import {Slide, ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import './Toast.css';

const Toast = () => {
    return (
        <ToastContainer
            position="top-center"
            transition={Slide}
            hideProgressBar
            draggable={false}
        />
    )
}

export default Toast;