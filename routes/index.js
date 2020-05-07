var express = require('express');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var bcrypt = require('bcrypt');
const saltRounds = 15;
var redis = require('../utils/redis');

var userModel = require('../models/userModel');

var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Signup */
router.post('/signup', (req, res) => {
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
    res.json({ message: "Password does not match!", code: -2 });
  } else {
    userModel.getByEmail(account.email)
      .then((data1) => {
        console.log(data1.length);
        if (data1.length > 0) { // Existed
          res.json({ message: 'Email existed', code: -1 });
        }
        else {
          console.log("RAW:" + account.password);
          bcrypt.hash(account.password, saltRounds, (err, hash) => {
            account.password = hash;
            console.log("Account 2.0: " + account.password);
            userModel.sign_up(account, company)
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
  }
})

/* Login */
router.post('/login', (req, res, next) => {
  console.log(req.body);
  passport.authenticate('local', { session: false }, (err, user, cb) => {
    if (user === false) {
      res.json({
        user,
        info: {
          message: cb.message,
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
        let payload = { id: user.loginUser.id_user };
        const token = jwt.sign(payload, 'S_Team');
        console.log("Logged in: " + JSON.stringify(req.user.loginUser));
        /* TODO add Cur token if not null to blacklist */
        redis.setKey(req.user.loginUser.currentToken);
        userModel.editToken(token)
          .then(result => {
            return res.json({ user, token, cb });
          }).catch(err => {
            return res.json({ err, code: 0 });
          })
      });
    }
  })(req, next);
});


module.exports = router;
