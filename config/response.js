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
    /* Login, signup, user error */
    WRONG_LOGIN_INFO: '-101',
    PASSWORD_NOT_MATCH: '-102',
    EMAIL_EXISTED: '-103',
    ACTIVATE_FAIL: '-104',
    CHANGE_PASSWORD_FAIL: '-105',
    EDIT_PERSONAL_FAIL: '-106',
    EDIT_COMPANY_FAIL: '-107',
    PASSWORD_RECOVERY_FAIL: '-108',

    //Get Fail
    GET_DATA_FAIL: '-200',
    /* DB error... */
    GET_DATA_FAIL: '-200',
    SAVE_TOKEN_FAIL: '-201',
    // Missing ID params
    ERROR_ID: '-202',
    // Interact Data Fail
    INTERACT_DATA_FAIL: '-203',
    // Create Data Fail
    CREATE_DATA_FAIL: '-204',
    // Missing body field or params
    MISSING_FIELD_OR_PARAMS: '-205',
    //Get data transaction MOMO Fail
    GET_RESULT_MOMO_FAIL: '-206',



    /* Mailing error */
    SEND_MAIL_FAIL: '-301',
    /* OK */
    LOGIN_SUCCESS: '101',
    SIGNUP_SUCCESS: '102',
    ACTIVATE_SUCCESS: '104',
    CHANGE_PASSWORD_SUCCESS: '105',
    EDIT_PERSONAL_SUCCESS: '106',
    EDIT_COMPANY_SUCCESS: '107',
    PASSWORD_RECOVERY_SUCCESS: '108',
    GET_DATA_SUCCESS: '200',
    CREATED_DATA_SUCCESS: '201',
    INTERACT_DATA_SUCCESS: '202',
    SEND_MAIL_SUCCESS: '301',
};

const mapCodeToMsg = {
    /* Token error messages */
    '-001': 'Invalid token, session timeout. Please login again!',
    '-002': 'No token received, cannot authenticate. Please login!',
    /* Login, signup error messages */
    '-101': 'Tài khoản hoặc mật khẩu không chính xác',
    '-102': 'Mật khẩu không đúng',
    '-103': 'Email này đã tồn tài',
    '-104': 'Token dùng để kích hoạt không trùng hớp!',
    '-105': 'Mật khẩu cũ không trùng khớp',
    '-106': 'Cannot edit personal information!',
    '-107': `Cannot edit company's information!`,
    '-108': 'Không thể khởi tạo mật khẩu mới!',
    /* DB interaction error messages */
    '-200': 'Cannot Get Data. It can be caused from your connection database!',
    '-201': 'Cannot renew token, please try logging in again!',
    '-202': 'Cannot find data by an required Id, please check your Id field in body!',
    '-203': 'Cannot interact data, please check your required fields in body!',
    '-204': 'Cannot create data, please check your field in body!',
    '-205': 'Please check your body field or params. We cannot find it or cannot accept your field',



    '-206': "Can't find data on MoMo Transaction",

    /* Nodemailer error messages */
    '-301': 'Việc gửi mail gặp vấn đề',

    '-401': 'Get Data Fail',
    /* OK message */
    '101': "Logged in",
    '102': "Signed up",
    '200': "Get Data successs",
    '201': "Create Data successs",
    '202': "Interact Data successs",


    '104': "Việc kích hoạt tài khoản của bạn đã thành công, vui lòng đăng nhập",
    '105': "Password changed! Please relogin with your new password!",
    '106': "Personal information changed!",
    '107': "Company's information changed",
    '108': 'Mật khẩu mới đã được gửi sang email của bạn!',
    '301': "Mail đã được gửi thành công",



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
    '-108': HTTPStatus.OK,
    '-200': HTTPStatus.BAD_REQUEST,
    '-201': HTTPStatus.INTERNAL_SERVER_ERROR,
    '-202': HTTPStatus.INTERNAL_SERVER_ERROR,

    '-203': HTTPStatus.BAD_REQUEST,
    '-204': HTTPStatus.BAD_REQUEST,
    '-205': HTTPStatus.BAD_REQUEST,
    '-206': HTTPStatus.OK,


    '-301': HTTPStatus.BAD_REQUEST,
    '101': HTTPStatus.OK,
    '102': HTTPStatus.OK,
    '104': HTTPStatus.OK,
    '105': HTTPStatus.OK,
    '106': HTTPStatus.OK,
    '107': HTTPStatus.OK,
    '108': HTTPStatus.OK,
    '301': HTTPStatus.OK,
    '200': HTTPStatus.OK,
    '201': HTTPStatus.OK,
    '202': HTTPStatus.OK,

}

/* Handle response */
const response = (res, definedCode, data = null) => {
    if (data === null)
    {            
        res.status(mapCodeToHTTPStatus[definedCode]).json({
            code: definedCode,
            message: mapCodeToMsg[definedCode],
        })
    }
    else
    {
        res.status(mapCodeToHTTPStatus[definedCode]).json({
            data: data,
            code: definedCode,
            message: mapCodeToMsg[definedCode],
        })
    }
};

module.exports.DEFINED_CODE = ResponsedCode;
// module.exports.MAP_CODE_MSG = mapCodeToMsg;
module.exports.response = response;
