var HTTPStatus = require('http-status');

/* 
    CODE FORMAT: 3-digit XYZ
    ERROR format: -XYZ
    OK/SUCCESS format: XYZ

    Classifications:
    X:                                              YZ: index
        0: token/ authenticated route related
        1: login, signup, user related
        2: database interaction related
        3: mailing related
*/

const ResponsedCode = {
    /* Token errors */
    INVALID_TOKEN: '-001',
    NULL_TOKEN: '-002',
    /* Login, signup error */
    WRONG_LOGIN_INFO: '-101',
    PASSWORD_NOT_MATCH: '-102',
    EMAIL_EXISTED: '-103',
    ACTIVATE_FAIL: '-104',
    CHANGE_PASSWORD_FAIL: '-105',
    EDIT_PERSONAL_FAIL: '-106',
    EDIT_COMPANY_FAIL: '-107',
    /* DB error... */
    SAVE_TOKEN_FAIL: '-201',
    ACCESS_DB_FAIL: '-202',
    /* Mailing error */
    SEND_MAIL_FAIL: '-301',
    /* OK */
    LOGIN_SUCCESS: '101',
    SIGNUP_SUCCESS: '102',
    ACTIVATE_SUCCESS: '104',
    CHANGE_PASSWORD_SUCCESS: '105',
    EDIT_PERSONAL_SUCCESS: '106',
    EDIT_COMPANY_SUCCESS: '107',
    SEND_MAIL_SUCCESS: '301',
};

const mapCodeToMsg = {
    /* Token error messages */
    '-001': 'Invalid token, session timeout. Please login again!',
    '-002': 'No token received, cannot authenticate. Please login!',
    /* Login, signup error messages */
    '-101': 'Wrong email or password',
    '-102': 'Confirmed password does not match',
    '-103': 'Email is already used',
    '-104': 'Avtivation token does not match!',
    '-105': 'Old password does not match',
    '-106': 'Cannot edit personal information!',
    '-107': `Cannot edit company's information!`,
    /* DB interaction error messages */
    '-201': 'Cannot renew token, please try logging in again!',
    '-202': 'Error with DB interaction!',
    /* Nodemailer error messages */
    '-301': 'Sending email failed',
    /* OK message */
    '101': "Logged in",
    '102': "Signed up",
    '104': "Activation success, you can now login to your account",
    '105': "Password changed! Please relogin with your new password!",
    '106': "Personal information changed!",
    '107': "Company's information changed",
    '301': "Mail sent",
}

const mapCodeToHTTPStatus = {
    '-001': HTTPStatus.UNAUTHORIZED,
    '-002': HTTPStatus.UNAUTHORIZED,
    '-101': HTTPStatus.OK,
    '-102': HTTPStatus.OK,
    '-103': HTTPStatus.OK,
    '-104': HTTPStatus.OK,
    '-105': HTTPStatus.OK,
    '-106': HTTPStatus.INTERNAL_SERVER_ERROR,
    '-107': HTTPStatus.INTERNAL_SERVER_ERROR,
    '-201': HTTPStatus.INTERNAL_SERVER_ERROR,
    '-202': HTTPStatus.INTERNAL_SERVER_ERROR,
    '-301': HTTPStatus.BAD_REQUEST,
    '101': HTTPStatus.OK,
    '102': HTTPStatus.OK,
    '104': HTTPStatus.OK,
    '105': HTTPStatus.OK,
    '106': HTTPStatus.OK,
    '107': HTTPStatus.OK,
    '301': HTTPStatus.OK,
}

/* Handle response */
const response = (res, definedCode, data = null) => {
    if (data === null)
        res.status(mapCodeToHTTPStatus[definedCode]).json({
            code: definedCode,
            message: mapCodeToMsg[definedCode],
        })
    else
        res.status(mapCodeToHTTPStatus[definedCode]).json({
            data: data,
            code: definedCode,
            message: mapCodeToMsg[definedCode],
        })
};

module.exports.DEFINED_CODE = ResponsedCode;
// module.exports.MAP_CODE_MSG = mapCodeToMsg;
module.exports.response = response;
