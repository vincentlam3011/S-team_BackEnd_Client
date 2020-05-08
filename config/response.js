var HTTPStatus = require('http-status');

const ResponsedCode = {
    /* Token errors */
    INVALID_TOKEN: '-001',
    NULL_TOKEN: '-002',
    /* Login error */
    WRONG_LOGIN_INFO: '-101',
    /* Server error */
    /* DB error... */
};

const mapCodeToMsg = {
    /* Token error messages */
    '-001': 'Invalid token',
    '-002': 'No token received',
    /* Login error messages */
    '-101': 'Wrong email or password',
    /* Classifications.... */
}

const mapCodeToHTTPStatus = {
    '-001': HTTPStatus.UNAUTHORIZED,
    '-002': HTTPStatus.UNAUTHORIZED,
    '-101': HTTPStatus.OK,
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
