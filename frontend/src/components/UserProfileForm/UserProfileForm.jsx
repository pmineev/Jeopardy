import {useEffect, useState} from 'react';
import {Form, Formik} from "formik";
import * as Yup from "yup";
import {toast} from "react-toastify";

import SubmitError from "../../common/forms/SubmitError";
import TextInput from "../../common/forms/TextInput";
import {getUsername} from "../../common/auth/services";
import {getUser, saveUser} from "./services";

const UserProfileForm = () => {
    const [credentials, setCredentials] = useState({nickname: '', password: ''});

    document.title = 'Профиль пользователя';

    useEffect(() => {
        getUser(getUsername())
            .then(response =>
                setCredentials({
                    username: response.data.username,
                    nickname: response.data.nickname,
                    password: ''
                })
            )
            .catch(errorCode => {
                switch (errorCode) {
                    case 'forbidden':
                    case 'user_not_found':
                        toast.error('Доступ запрещен');
                        break;
                    default:
                        console.log(errorCode);
                }
            });
    }, [])

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
                        saveUser(credentials.username, values.nickname, values.password)
                            .then(() => {
                                    setSubmitting(false);
                                    toast('Данные сохранены');
                                }
                            )
                            .catch(errorCode => {
                                let errorText;

                                switch (errorCode) {
                                    case 'nickname_already_exists':
                                        errorText = 'Ник занят';
                                        break;
                                    case 'forbidden':
                                    case 'user_not_found':
                                        errorText = 'Доступ запрещен';
                                        break;
                                    default:
                                        errorText = 'Ошибка';
                                }

                                setErrors({'submitError': errorText});
                            })
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