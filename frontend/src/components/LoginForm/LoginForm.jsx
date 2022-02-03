import {Form, Formik} from "formik";
import * as Yup from "yup";
import {Link, useHistory} from "react-router-dom";

import SubmitError from "../../common/forms/SubmitError";
import TextInput from "../../common/forms/TextInput";
import {useAuth} from "../../common/auth/auth";

const LoginForm = () => {
    const auth = useAuth();
    const history = useHistory();

    document.title = 'Вход';

    return (
        <div className='form'>
            <Formik
                initialValues={{
                    username: '',
                    password: '',
                }}
                validationSchema={Yup.object({
                    username: Yup.string()
                        .required('Обязательное поле'),
                    password: Yup.string()
                        .required('Обязательное поле')
                })}
                onSubmit={(values, {setSubmitting, setErrors}) => {
                    auth.login(values)
                        .then(() => {
                            setSubmitting(false);
                            history.push('/games');
                        })
                        .catch(error => {
                            setErrors({'submitError': error.message});
                        })
                }}
            >
                <Form>
                    <header>Вход</header>
                    <TextInput
                        label="Имя пользователя"
                        name="username"
                        type="text"
                    />
                    <TextInput
                        label="Пароль"
                        name="password"
                        type="password"
                    />

                    <SubmitError name='submitError'/>

                    <Link to='/register'>Еще не зарегистрированы?</Link>

                    <button type="submit">Войти</button>
                </Form>
            </Formik>
        </div>
    );
};

export default LoginForm;