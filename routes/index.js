var express = require('express');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var bcrypt = require('bcrypt');
const saltRounds = 15;

var userModel = require('../models/userModel');

var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Dummy login api */
// router.post('/login', function (req, res, next) {
//   let { email, password } = req.body;

//   if (email === 'admin' && password === '123') {
//     res.json({
//       code: 1,
//       data: {
//         id: 1,
//         email,
//       },
//       message: 'Login successfully',
//       error: null,
//     })
//   }
//   else if (email === 'admin') {
//     res.json({
//       code: 0,
//       data: null,
//       message: 'Wrong account',
//       error: null,
//     })
//   }
//   else {
//     res.json({
//       code: 0,
//       data: null,
//       message: 'Account doesnt exist',
//       error: null,
//     })
//   }
// });

/* Signup */
router.post('/signup', (req, res) => {
  var account = req.body;
  console.log(account);
  userModel.getByEmail(account.email)
    .then((data1) => {
      console.log(data1.length);
      if (data1.length > 0) { // Existed
        res.json({ message: 'Email existed', code: -1, note: data1 });
      }
      else {
        bcrypt.hash(account.password, saltRounds, (err, hash) => {
          account.password = hash;
          console.log("Account 2.0: " + account.password);
          userModel.sign_up(account)
            .then((data2) => {
              res.json({ message: 'Success signing up', code: 1, note: data2 });
            }).catch((err2) => {
              res.json({ message: err2, code: 0 })
            })
        })
      }
    }).catch((err1) => {
      res.json({ message: err1, code: 0 });
    })
})

/* Login */
router.post('/login', (req, res, next) => {
  console.log(req.body);
  passport.authenticate('local', { session: false }, (err, user, info) => {
    
    if (user === false) {
      res.json({
        user,
        info: {
          message: info.message,
          code: 0,
        }
      })
    }
    else {
      if (err || !user) {
        return res.status(400).json({
          message: 'Something is not right',
          user: user,
          err,
        });
      }

      req.login(user, { session: false }, (err) => {
        if (err) {
          res.send(err);
        }
        let payload = { id: user.loginUser.id };
        const token = jwt.sign(payload, 'S_Team');
        return res.json({ user, token, info });
      });
    }
  })(req, res);
});

module.exports = router;
