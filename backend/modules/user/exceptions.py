class UserAlreadyExists(Exception):
    error = 'user_already_exists'


class UserNicknameAlreadyExists(Exception):
    error = 'nickname_already_exists'


class UserNotFound(Exception):
    error = 'user_not_found'
