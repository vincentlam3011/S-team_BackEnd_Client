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
    /* DB error... */
    SAVE_TOKEN_FAIL: '-201',
    GET_DATA_FAIL : '-200',
    CREATE_DATA_FAIL : '-204',
    // Edit ~ Accepted
    INTERACT_DATA_FAIL : '-203', 
    ERROR_ID : '-202', 

    /* Mailing error */
    SEND_MAIL_FAIL: '-301',
    /* OK */
    LOGIN_SUCCESS: '101',
    SIGNUP_SUCCESS: '102',
    SEND_MAIL_SUCCESS: '301',
    GET_DATA_SUCCESS: '200',
    CREATED_DATA_SUCCESS: '201',
    INTERACT_DATA_SUCCESS: '202',



};

const mapCodeToMsg = {
    /* Token error messages */
    '-001': 'Invalid token, session timeout. Please login again!',
    '-002': 'No token received, cannot authenticate. Please login!',
    /* Login, signup error messages */
    '-101': 'Wrong email or password',
    '-102': 'Confirmed password does not match',
    '-103': 'Email is already used',
    /* DB interaction error messages */
    '-200': 'Cannot Get Data. It can be caused from your connection database!',
    '-201': 'Cannot renew token, please try logging in again!',
    '-204': 'Cannot create data, please check your field in body!',
    '-202': 'Cannot find data by an required Id, please check your Id field in body!',
    '-203': 'Cannot interact data, please check your required fields in body!',

    /* Nodemailer error messages */
    '-301': 'Sending email failed',
    
    '-401': 'Get Data Fail',
    /* OK message */
    '101': "Logged in",
    '102': "Signed up",
    '200': "Get Data successs",
    '201': "Create Data successs",
    '202': "Interact Data successs",

    '301': "Mail sent",


    
}

const mapCodeToHTTPStatus = {
    '-001': HTTPStatus.UNAUTHORIZED,
    '-002': HTTPStatus.UNAUTHORIZED,
    '-101': HTTPStatus.OK,
    '-102': HTTPStatus.OK,
    '-103': HTTPStatus.OK,
    '-200': HTTPStatus.BAD_REQUEST,
    '-201': HTTPStatus.BAD_REQUEST,
    '-202': HTTPStatus.OK,
    '-203': HTTPStatus.BAD_REQUEST,
    '-301': HTTPStatus.BAD_REQUEST,
    '101': HTTPStatus.OK,
    '102': HTTPStatus.OK,
    '301': HTTPStatus.OK,
    '200': HTTPStatus.OK,
    '201': HTTPStatus.OK,
    '202': HTTPStatus.OK,


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
