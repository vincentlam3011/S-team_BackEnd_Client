var express = require('express');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
const saltRounds = 15;
var redis = require('../utils/redis');

var userModel = require('../models/userModel');
var jobTopicModel = require('../models/jobTopicModel');
var jobModel = require('../models/jobModel');
var convertBlobB64 = require('../middleware/convertBlobB64');
var router = express.Router();

var { response, DEFINED_CODE } = require('../config/response');
var { mailer } = require('../utils/nodemailer');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
//Get Jobs Topic
router.get('/allJobTopics', function (req, res, next) {
  jobTopicModel.getAllJobTopics().then(data => {
    if (data.length > 0) {
      data.forEach(element => {
        element.img = convertBlobB64.convertBlobToB64(element.img);
      });
      res.json({ message: 'Get Data Success', data, code: 1 })
    }

  }).catch((err1) => {
    res.json({ message: err1, code: 0 });
  })
});
router.get('/jobsByJobTopic/:id', function (req, res, next) {
  console.log('params:', req.params);
  let job_topic = req.params.id;
  console.log('job_topic:', job_topic);
  jobModel.getJobById(job_topic).then(data => {
    if (data.length > 0) {
      data.forEach(element => {
        element.img = convertBlobB64.convertBlobToB64(element.img);
      });
      res.json({ message: 'Get Data Success', data, code: 1 })
      //   }
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
    account_status: 0, // default = 0
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
    response(res, DEFINED_CODE.PASSWORD_NOT_MATCH);
  } else {
    userModel.getByEmail(account.email)
      .then((data1) => {
        console.log(data1.length);
        if (data1.length > 0) { // Existed
          response(res, DEFINED_CODE.EMAIL_EXISTED);
        }
        else {
          bcrypt.hash(account.password, saltRounds, (err, hash) => {
            if (err) {
              res.json({ message: "Cannot sign up", error: err })
            }
            account.password = hash;
            var activateToken = crypto.randomBytes(10).toString('hex');
            account.activationToken = activateToken;
            var exprTime = new Date(Date.now() + 5 * 60000);
            var localTime = exprTime.toLocaleTimeString('en-GB', { hour12: false });
            var localDate = exprTime.toLocaleDateString('en', { month: "2-digit", day: "2-digit", year: "numeric" });
            var localYear = localDate.slice(6, 10);
            var localMonth = localDate.slice(0, 2);
            var localDay = localDate.slice(3, 5);
            localDate = localYear + '-' + localMonth + '-' + localDay;
            var localDateTime = localDate + ' ' + localTime;
            account.activationExpr = localDateTime;
            userModel.sign_up(account, company)
              .then((data2) => {

                var mailOptions = {
                  subject: "Account activation",
                  text:
                    `Dear customer. \n\n`
                    + 'You are receiving this because you (or someone else) have signed up to our website.\n\n'
                    + 'Please click on the following link, or paste this into your browser to complete the process:\n\n'
                    + `*Activation link* ${activateToken}\n\n`
                    + 'If you did not request this, please ignore this email and your account will not be activate.\n'
                    + 'F2L Support team',
                }
                mailer(mailOptions, 'F2L S_Team', account.email, res);
                response(res, DEFINED_CODE.SIGNUP_SUCCESS);
              }).catch((err2) => {
                response(res, DEFINED_CODE.ACCESS_DB_FAIL, err2);
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
        let payload = { id: user.loginUser.id_user, isBusinessUser: user.loginUser.isBusinessUser };
        const token = jwt.sign(payload, 'S_Team', { expiresIn: '24h' });
        if (req.user.loginUser.currentToken !== null)
          redis.setKey(req.user.loginUser.currentToken);
        userModel.editToken(req.user.loginUser.id_user, token)
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

/* Activate */
router.put('/activation/:activationToken', (req, res, next) => {
  var activationToken = req.param('activationToken');
  userModel.verifyActivation(activationToken)
    .then(data => {
      if (data.length > 0) {
        if (data[0].account_status === 1) {
          response(res, DEFINED_CODE.ACTIVATE_FAIL, 'Already activated');
          // res.redirect();
          return;
        } else {
          if (data[0].isExpr <= 0) {
            userModel.updateUserInfo(data[0].id_user, [{ field: 'account_status', value: 1 }])
              .then(result => {
                response(res, DEFINED_CODE.ACTIVATE_SUCCESS);
              }).catch(err => {
                response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
              })
          } else {
            response(res, DEFINED_CODE.ACTIVATE_FAIL, "Activation code expired, please request a new one!");
            return;
          }
        }
      } else {
        response(res, DEFINED_CODE.ACTIVATE_FAIL, 'User not found');
      }
    }).catch(err => {
      response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
    })
});

/* Request new activation mail */
router.post('/resendActivation', (req, res, next) => {
  var email = req.body.email;
  var activateToken = crypto.randomBytes(10).toString('hex');
  var exprTime = new Date(Date.now() + 5 * 60000);
  var localTime = exprTime.toLocaleTimeString('en-GB', { hour12: false });
  var localDate = exprTime.toLocaleDateString('en', { month: "2-digit", day: "2-digit", year: "numeric" });
  var localYear = localDate.slice(6, 10);
  var localMonth = localDate.slice(0, 2);
  var localDay = localDate.slice(3, 5);
  localDate = localYear + '-' + localMonth + '-' + localDay;
  var localDateTime = localDate + ' ' + localTime;
  userModel.getByEmail(email, -1)
    .then(data => {
      if (data.length > 0) {
        var updates = [
          { field: 'activationToken', value: `'${activateToken}'` },
          { field: 'activationExpr', value: `'${localDateTime}'` },
        ]
        userModel.updateUserInfo(data[0].id_user, updates)
          .then(result => {
            var mailOptions = {
              subject: "Account activation",
              text:
                `Dear customer. \n\n`
                + 'You are receiving this because you (or someone else) have signed up to our website.\n\n'
                + 'Please click on the following link, or paste this into your browser to complete the process:\n\n'
                + `*Activation link* ${activateToken}\n\n`
                + 'If you did not request this, please ignore this email and your account will not be activate.\n'
                + 'F2L Support team',
            }
            mailer(mailOptions, 'F2L S_Team', email, res);
            response(res, DEFINED_CODE.SEND_MAIL_SUCCESS, result);
          }).catch(err => {
            response(res, DEFINED_CODE.SEND_MAIL_FAIL, err);
          })
      } else {
        response(res, DEFINED_CODE.SEND_MAIL_FAIL, "User not found or already activated!");
      }
    })
})

/* Forgot password */
router.put('/forget', (req, res, next) => {
  var email = req.body.email;
  userModel.getByEmail(email, 1)
    .then(data => {
      if (data.length > 0) {
        var newPassword = crypto.randomBytes(4).toString('hex');
        bcrypt.hash(newPassword, saltRounds, (err, hashed) => {
          if (err) {
            response(res, DEFINED_CODE.PASSWORD_RECOVERY_FAIL, err); return;
          } else {
            var mailOptions = {
              subject: "Password recovery",
              text:
                `Dear ${data[0].fullname}. \n\n`
                + 'You are receiving this because you forgot the password of your account.\n'
                + 'We are sending you a new password below, you can use it to login to our system:\n\n'
                + `${newPassword}\n\n`
                + 'If you did not request this, please ignore this email.\n\n'
                + 'F2L Support team',
            };
            userModel.updateUserInfo(data[0].id_user, [{ field: 'password', value: `'${hashed}'` }])
              .then(result => {
                mailer(mailOptions, 'F2L S_Team', email, res);
                response(res, DEFINED_CODE.PASSWORD_RECOVERY_SUCCESS);
              }).catch(err => {
                response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
              });
          }
        });
      } else {
        response(res, DEFINED_CODE.PASSWORD_RECOVERY_FAIL, { note: "Account invalid" }); return;
      }
    }).catch(err => {
      response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
    })
})

//Get Jobs By Id
router.get('/getJob/:id', function (req, res, next) {
  let id_job = req.params.id;
  jobModel.getJobById(id_job).then(data => {
    res.json({ message: "Get Successfull", info: data, code: 1 });
  }).catch(err => {
    res.json({ err, code: 0 });
  })
});

module.exports = router;
