import {Form, Formik} from "formik";
import * as Yup from "yup";
import TextInput from "./inputs";

const LoginForm = () => {
    return (
        <>
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
                onSubmit={(values, {setSubmitting}) => {
                    setTimeout(() => {
                        alert(JSON.stringify(values, null, 2));
                        setSubmitting(false);
                    }, 400);
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

                    <button type="submit">Войти</button>
                </Form>
            </Formik>
        </>
    );
};

export default LoginForm;