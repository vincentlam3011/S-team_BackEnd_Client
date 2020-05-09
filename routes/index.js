var express = require('express');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var bcrypt = require('bcrypt');
const saltRounds = 15;
var redis = require('../utils/redis');

var userModel = require('../models/userModel');
var jobTopicModel = require('../models/jobTopicModel');

var router = express.Router();

var { response, DEFINED_CODE } = require('../config/response');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/allJobTopics', function (req, res, next) {
  jobTopicModel.getAllJobTopics().then(data => {
    if (data.length > 0) {
      // data.forEach(element => {
      //   let buffer = new Buffer(element.img);
      //   let bufferBase64 = buffer.toString('base64');
      //   element.img = bufferBase64;
      // });
      res.json({ data })
    }

  }).catch((err1) => {
    res.json({ message: err1, code: 0 });
  })
});

/* Signup */
router.post('/signup', (req, res) => {
  console.log('body:', req.body);
  var account = {
    fullname: req.body.fullname,
    dob: req.body.dob,
    email: req.body.email,
    password: req.body.password,
    dial: req.body.dial,
    address: req.body.address,
    isBusinessUser: req.body.isBusinessUser,
    gender: req.body.gender,
    account_status: req.body.account_status, // default = 0
    confirm: req.body.confirm,
  };
  var company = null;

  if (account.isBusinessUser != 0) {
    company = {
      company_name: req.body.company_name,
      position: req.body.position,
      company_address: req.body.company_address,
      company_email: req.body.company_email,
      number_of_employees: req.body.number_of_employees,
    }
  }

  if (account.password !== account.confirm) {
    // res.json({ message: "Password does not match!", code: -2 });
    response(res, DEFINED_CODE.PASSWORD_NOT_MATCH);
  } else {
    userModel.getByEmail(account.email)
      .then((data1) => {
        console.log(data1.length);
        if (data1.length > 0) { // Existed
          // res.json({ message: 'Email existed', code: -1 });
          response(res, DEFINED_CODE.EMAIL_EXISTED);
        }
        else {
          console.log("RAW:" + account.password);
          bcrypt.hash(account.password, saltRounds, (err, hash) => {
            account.password = hash;
            userModel.sign_up(account, company)
              .then((data2) => {
                // res.json({ message: 'Success signing up', code: 1, note: data2 });
                response(res, DEFINED_CODE.SIGNUP_SUCCESS);
              }).catch((err2) => {
                response(res, DEFINED_CODE.WRONG_LOGIN_INFO);
              })
          })
        }
      }).catch((err1) => {
        res.json({ message: err1, code: 0 });
      })
  }
})

/* Login */
router.post('/login', (req, res, next) => {
  console.log(req.body);
  passport.authenticate('local', { session: false }, (err, user, cb) => {
    if (user === false) {
      response(res, DEFINED_CODE.WRONG_LOGIN_INFO);
    }
    else {
      if (err || !user) {
        response(res, DEFINED_CODE.WRONG_LOGIN_INFO); return;
      }

      req.login(user, { session: false }, (err) => {
        if (err) {
          res.send(err);
        }
        let payload = { id: user.loginUser.id_user };
        const token = jwt.sign(payload, 'S_Team', { expiresIn: '24h' });

        redis.setKey(req.user.loginUser.currentToken);
        userModel.editToken(token)
          .then(result => {
            // return res.json({ user, token, cb });
            response(res, DEFINED_CODE.LOGIN_SUCCESS, { user: user.loginUser, token });
          }).catch(err => {
            // return res.json({ err, code: 0 });
            response(res, DEFINED_CODE.SAVE_TOKEN_FAIL);
          })
      });
    }
  })(req, next);
});


module.exports = router;
