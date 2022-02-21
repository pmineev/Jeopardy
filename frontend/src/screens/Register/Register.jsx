import {Form, Formik} from "formik";
import * as Yup from "yup";
import {Link, useNavigate} from "react-router-dom";

import SubmitError from "../../common/forms/SubmitError";
import TextInput from "../../common/forms/TextInput";
import {registerUser} from "../../common/auth/services";

const Register = () => {
    const navigate = useNavigate();

    document.title = 'Регистрация'

    return (
        <div className='register'>
            <Formik
                initialValues={{
                    username: '',
                    nickname: '',
                    password: '',
                }}
                validationSchema={Yup.object({
                    username: Yup.string()
                        .min(2, 'Не менее 2 символов')
                        .max(25, 'Не более 25 символов')
                        .matches(/\S/, 'Тут же пусто')
                        .required('Обязательное поле'),
                    nickname: Yup.string()
                        .min(2, 'Не менее 2 символов')
                        .max(25, 'Не более 25 символов')
                        .matches(/\S/, 'Тут же пусто'),
                    password: Yup.string()
                        .min(6, 'Не менее 6 символов')
                        .max(128, 'Не более 128 символов')
                        .matches(/\S/, 'Одни пробелы - это нехорошо')
                        .required('Обязательное поле')
                })}
                onSubmit={({username, nickname, password}, {setSubmitting, setErrors}) => {
                    registerUser(username, nickname || username, password)
                        .then(() => {
                            console.log('зареган');
                            setSubmitting(false);
                            navigate('/games');
                        })
                        .catch(errorCode => {
                            let errorText;

                            switch (errorCode) {
                                case 'user_already_exists':
                                    errorText = 'Имя пользователя занято';
                                    break;
                                case 'nickname_already_exists':
                                    errorText = 'Ник занят';
                                    break;
                                default:
                                    errorText = 'Ошибка';
                                    console.log(errorCode);
                            }

                            setErrors({'submitError': errorText});
                        })
                }}
            >
                <Form>
                    <h1>Регистрация</h1>

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

export default Register;