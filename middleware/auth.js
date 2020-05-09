var passport = require('passport');
var redis = require('../utils/redis');

var { response, DEFINED_CODE } = require('../config/response');

var validateTokenInBlacklist = (req, res, next) => {
    var token = null;
    if (!req.headers.authorization) {
        console.log("No token");
        response(res, DEFINED_CODE.NULL_TOKEN);
    }
    token = req.headers.authorization.slice(7);
    console.log("TOKEN: " + token);
    redis.getKey(token).then(isNotInBlacklist => {
        if (isNotInBlacklist) {
            next();
        }
        else {
            response(res, DEFINED_CODE.INVALID_TOKEN);
        }
    }).catch(err => {
        console.log(err);
        res.json({ message: "Cannot connect to Redis", error: err, code: 0 });
    })
};
module.exports.validateTokenInBlacklist = validateTokenInBlacklist;
module.exports.passportStrategy = passport.authenticate('jwt', { session: false });