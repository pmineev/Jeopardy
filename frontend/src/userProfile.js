import {useAuth} from "./auth";
import {Form, Formik} from "formik";
import * as Yup from "yup";
import {SubmitError, TextInput} from "./inputs";
import {UserProfileService} from "./services";
import {useEffect, useState} from 'react'

const userProfileService = new UserProfileService()

const UserProfileForm = () => {
    const auth = useAuth();
    const [credentials, setCredentials] = useState({nickname: '', password: ''});

    document.title = 'Профиль пользователя';

    useEffect(() => {
        userProfileService.get(auth.getUsername())
            .then(response =>
                setCredentials({
                    username: response.data.username,
                    nickname: response.data.nickname,
                    password: ''
                })
            )
    }, [auth])

    return (
        <div className='form'>
            <Formik
                enableReinitialize
                initialValues={credentials}
                validationSchema={Yup.object({
                    nickname: Yup.string()
                        .optional()
                        .min(2, 'Не менее 2 символов')
                        .max(25, 'Не более 25 символов'),
                    password: Yup.string()
                        .optional()
                        .min(6, 'Не менее 6 символов')
                        .max(128, 'Не более 128 символов')
                })}
                onSubmit={(values, {setSubmitting, setErrors}) => {
                    if (values.nickname.length === 0 && values.password.length === 0)
                        setErrors({'submitError': 'Заполните хотя бы одно поле'})
                    else
                        userProfileService.save(credentials.username, values.nickname, values.password)
                            .then(() =>
                                setSubmitting(false)
                            );
                }}
            >
                <Form>
                    <header>Профиль</header>
                    <TextInput
                        label="Ник"
                        name="nickname"
                        type="text"
                    />
                    <TextInput
                        label="Пароль"
                        name="password"
                        type="password"
                    />

                    <SubmitError name='submitError'/>

                    <button type="submit">Сохранить</button>
                </Form>
            </Formik>
        </div>
    );
};

export default UserProfileForm;