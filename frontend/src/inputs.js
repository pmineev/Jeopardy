import {useField} from "formik";

const TextInput = ({label, ...props}) => {
    const [field, meta] = useField(props);

    return (
        <div className='form-group'>
            <label htmlFor={props.name}> {label} </label>
            <input className="text-input" {...field} {...props} />
            <div className="error" style={{visibility: (meta.touched && meta.error) ? 'visible' : 'hidden'}}>
                {meta.error || 'no error'} </div>
        </div>
    );
};

const SubmitError = (name) => {
    const [, meta] = useField(name);

    return (
        <div className='form-group'>
            <div className="error" style={{visibility: meta.error ? 'visible' : 'hidden'}}>
                {meta.error || 'no error'} </div>
        </div>
    );
};

export {TextInput, SubmitError};