import {useField} from "formik";

const SubmitError = (name) => {
    const [, meta] = useField(name);

    return (
        <div className='form-group'>
            <div className="error" style={{visibility: meta.error ? 'visible' : 'hidden'}}>
                {meta.error || 'no error'} </div>
        </div>
    );
};

export default SubmitError;