const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const bcrypt = require('bcrypt');

const userModel = require('./models/userModel');

passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password',
    },
    function(email, password, cb){
        console.log("Login authenticated");
        console.log(email);
        return userModel.getByEmail(email)
            .then((data) => {
                console.log(data);
                if (data.length > 0) { // Existed
                    // if (password === data[0].password) {
                    //     return cb(null, { loginUser: data[0] }, { message: 'Logged in successfully', code: 3 });
                    // }
                    // else {
                    //     cb(null, false, { message: 'Wrong password', code: 1 });
                    // }
                    bcrypt.compare(password, data[0].password, (err, res) => {
                        if (res === true) {
                            return cb(null, { loginUser: data[0] }, { message: 'Logged in successfully', code: 3 });
                        } else {
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
))

passport.use(new JWTStrategy(
    {
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: 'S_Team',
    },
    function (jwtPayload, cb) {
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