import {useField} from "formik";

const TextInput = ({label, ...props}) => {
    const [field, meta] = useField(props);

    return (
        <div className='input-group'>
            <label htmlFor={props.name}> {label} </label>
            <input  {...field} {...props} />
            <div className={'error' + ((meta.touched && meta.error) ? '' : ' hidden')}>
                {meta.error || 'пусто'}
            </div>
        </div>
    );
};

export default TextInput;