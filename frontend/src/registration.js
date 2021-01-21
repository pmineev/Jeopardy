import {Form, Formik} from "formik";
import * as Yup from "yup";
import TextInput from "./inputs";

const SignupForm = () => {
    return (
        <>
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
                        .required('Обязательное поле'),
                    nickname: Yup.string()
                        .min(2, 'Не менее 2 символов')
                        .max(25, 'Не более 25 символов'),
                    password: Yup.string()
                        .min(6, 'Не менее 6 символов')
                        .max(128, 'Не более 128 символов')
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

                    <button type="submit">Зарегистрировать</button>
                </Form>
            </Formik>
        </>
    );
};

export default SignupForm;