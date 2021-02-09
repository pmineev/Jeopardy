import {Form, Formik} from "formik";
import * as Yup from "yup";
import {SubmitError, TextInput} from "./inputs";
import {useAuth} from "./auth";
import {Link, useHistory} from "react-router-dom";

const RegisterForm = () => {
    const auth = useAuth();
    const history = useHistory();
    return (
        <div className='form'>
            <Formik
                initialValues={{
                    username: 'qqqqqqqqqq',
                    nickname: 'qqqqqqqqqqqqqqqqqq',
                    password: 'qqqqqqqqqq',
                }}
                validationSchema={Yup.object({
                    username: Yup.string()
                        .min(2, 'Не менее 2 символов')
                        .max(25, 'Не более 25 символов')
                        .required('Обязательное поле'),
                    nickname: Yup.string()
                        .min(2, 'Не менее 2 символов')
                        .max(25, 'Не более 25 символов'),
                    password: Yup.string()
                        .min(6, 'Не менее 6 символов')
                        .max(128, 'Не более 128 символов')
                        .required('Обязательное поле')
                })}
                onSubmit={(values, {setSubmitting, setErrors}) => {
                    auth.register(values)
                        .then(() => {
                            console.log('зареган');
                            setSubmitting(false);
                            history.push('/games');
                        })
                        .catch(error => {
                            setErrors({'submitError': error.message});
                        })
                }}
            >
                <Form>
                    <header>Регистрация</header>
                    <TextInput
                        label="Имя пользователя"
                        name="username"
                        type="text"
                    />
                    <TextInput
                        label="Ник"
                        name="nickname"
                        type="text"
                        placeholder='Необязательно'
                    />
                    <TextInput
                        label="Пароль"
                        name="password"
                        type="password"
                    />

                    <SubmitError name='submitError'/>

                    <Link to='/login'>Уже зарегистрированы?</Link>

                    <button type="submit">Зарегистрировать</button>
                </Form>
            </Formik>
        </div>
    );
};

export {RegisterForm};