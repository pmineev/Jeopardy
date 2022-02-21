import {Form, Formik} from "formik";
import * as Yup from "yup";
import {Link, useNavigate} from "react-router-dom";

import SubmitError from "../../common/forms/SubmitError";
import TextInput from "../../common/forms/TextInput";
import {loginUser} from "../../common/auth/services";

const Login = () => {
    const navigate = useNavigate();

    document.title = 'Вход';

    return (
        <div className='login'>
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
                onSubmit={({username, password}, {setSubmitting, setErrors}) => {
                    loginUser(username, password)
                        .then(() => {
                            setSubmitting(false);
                            navigate('/games');
                        })
                        .catch(errorCode => {
                            let errorText;

                            switch (errorCode) {
                                case 'user_not_found':
                                    errorText = 'Неверные данные';
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
                    <h1>Вход</h1>
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

export default Login;