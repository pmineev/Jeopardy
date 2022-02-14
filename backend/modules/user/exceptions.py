class UserAlreadyExists(Exception):
    code = 'user_already_exists'


class UserNicknameAlreadyExists(Exception):
    code = 'nickname_already_exists'


class UserNotFound(Exception):
    code = 'user_not_found'
