import {Slide, ToastContainer} from "react-toastify";

const Toast = () => {
    return (
        <ToastContainer
            position="top-center"
            transition={Slide}
            hideProgressBar
            draggable={false}
            closeButton={false}
            pauseOnFocusLoss={false}
            autoClose={3000}
        />
    )
}

export default Toast;