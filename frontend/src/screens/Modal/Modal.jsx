import ReactModal from "react-modal";

const Modal = ({isOpen, onRequestClose, children}) => {
    return (
        <ReactModal
            className='modal'
            overlayClassName='overlay'
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            ariaHideApp={false}
        >
            {children}
        </ReactModal>
    )
};

export default Modal;