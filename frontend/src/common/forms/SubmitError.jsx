import {useField} from "formik";

const SubmitError = (name) => {
    const [, meta] = useField(name);

    return (
        <div className='input-group'>
            <div className={'error' + (meta.error ? '' : ' hidden')}>
                {meta.error || 'пусто'}
            </div>
        </div>
    );
};

export default SubmitError;