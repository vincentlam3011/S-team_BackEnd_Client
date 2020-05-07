const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const bcrypt = require('bcrypt');
const redis = require('./utils/redis');

const userModel = require('./models/userModel');

passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password',
    },
    function (username, password, cb) {
        console.log("local login authenticate");
        console.log(username);
        return userModel.getByEmail(username, true)
            .then((data) => {
                if (data.length > 0) {
                    bcrypt.compare(password, data[0].password, (err, res) => {
                        if (res) {
                            return cb(null, { loginUser: data[0] }, { message: 'Logged in successfully', code: 3 });
                        }
                        else {
                            cb(null, false, { message: 'Wrong password', code: 1 });
                        }
                    })
                }
                else {
                    return cb(null, false, { message: 'Wrong email', code: 0 });
                }
            })
            .catch((error) => {
                return cb(error)
            });
    }
));



passport.use(new JWTStrategy(
    {
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: 'S_Team',
    },
    function (jwtPayload, cb) {
        // console.log("PAYLOAD: " + JSON.stringify(jwtPayload));

        return userModel.getByID(jwtPayload.id)
            .then(user => {
                if (user.length > 0)
                    return cb(null, user[0], { message: 'Authorized', code: 1 });
                else
                    return cb(null, null, { message: 'Cannot get User', code: 0 })
            })
            .catch(err => {
                return cb(err, null, { message: 'Can not authorized', code: 0 });
            });
    },
));

module.exports.authHandler = (token) => {
    passport.use(new JWTStrategy(
        {
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
            secretOrKey: 'S_Team',
        },
        function (jwtPayload, cb) {
            console.log(JSON.stringify(jwtPayload));
            token = token.slice(7);
            console.log("TOKEN: " + token);
            redis.getKey(token).then(isValid => {
                if (isValid === true) {
                    console.log(isValid);
                    return userModel.getByID(jwtPayload.id)
                        .then(user => {
                            if (user.length > 0)
                                return cb(null, user[0], { message: 'Authorized', code: 1 });
                            else
                                return cb(null, null, { message: 'Cannot get User', code: 0 })
                        })
                        .catch(err => {
                            return cb(err, null, { message: 'Can not authorized', code: 0 });
                        });
                } else {
                    return cb(null, null, { message: 'Cannot get User', code: 0 })
                }
            }).catch(err => {
                return cb(err, null, { message: err, code: 0 });
            })
        },
    ));
}