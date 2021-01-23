import {Form, Formik} from "formik";
import * as Yup from "yup";
import {SubmitError, TextInput} from "./inputs";
import {useAuth} from "./auth";
import {useHistory} from "react-router-dom";

const LoginForm = () => {
    const auth = useAuth();
    const history = useHistory();
    return (
        <>
            <Formik
                initialValues={{
                    username: 'frok',
                    password: '1234',
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
                            console.log('залогинен');
                            console.log(auth.isAuthenticated + 'login');
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

                    <button type="submit">Войти</button>
                </Form>
            </Formik>
        </>
    );
};

export default LoginForm;