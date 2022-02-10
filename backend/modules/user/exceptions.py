class UserAlreadyExists(Exception):
    error = 'user_elready_exists'


class UserNicknameAlreadyExists(Exception):
    error = 'nickname_anready_exists'


class UserNotFound(Exception):
    error = 'user_not_found'
