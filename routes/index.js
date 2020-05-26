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
var distrinctProvinceModel = require('../models/districtProvinceModel');
var tagModel = require('../models/tagModel');

var convertBlobB64 = require('../middleware/convertBlobB64');
var router = express.Router();

var { response, DEFINED_CODE } = require('../config/response');
var { mailer } = require('../utils/nodemailer');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});
//Get Jobs Topic
router.get('/allJobsTopics', function (req, res, next) {
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
  jobModel.getJobByIdJobTopic(job_topic).then(data => {
    if (data.length > 0) {
      console.log("Have Data:", data)
      data.forEach(element => {
        if (element.img) {
          let buffer = new Buffer(element.img);
          let bufferBase64 = buffer.toString('base64');
          element.img = bufferBase64;
        }
      });
      response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);

      //   }
    }
    else {
      response(res, DEFINED_CODE.GET_DATA_SUCCESS, [])
    }
  }).catch((err) => {
    response(res, DEFINED_CODE.GET_DATA_FAIL, err);

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
            account.password = hash;
            userModel.sign_up(account, company)
              .then((data2) => {
                var activateToken = crypto.randomBytes(10).toString('hex');
                var mailOptions = {
                  subject: "Account activation",
                  text:
                    `Dear customer. \n\n`
                    + 'You are receiving this because you (or someone else) have signed up to our website.\n\n'
                    + 'Please click on the following link, or paste this into your browser to complete the process:\n\n'
                    + `${activateToken}\n\n`
                    + 'If you did not request this, please ignore this email and your account will not be activate.\n'
                    + 'F2L Support team',
                }
                mailer(mailOptions, 'F2L S_Team', account.email, res);
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
router.put('/activation/:id', (req, res, next) => {
  // var activationCode = req.body.activation_code;
  console.log(req.param('id'));
  userModel.getByID(req.param('id'))
    .then(user => {
      if (user.length > 0 && user[0].account_status === 0) {
        var updates = [{ field: 'account_status', value: 1 }];
        userModel.updateUserInfo(req.param('id'), updates)
          .then(data => {
            response(res, DEFINED_CODE.ACTIVATE_SUCCESS);
          }).catch(err => {
            response(res, DEFINED_CODE.ACTIVATE_FAIL);
          })
      } else {
        response(res, DEFINED_CODE.ACTIVATE_FAIL, 'Account is already activated or does not exist!');
        // res.redirect('...') 
      }
    }).catch(err => {
      response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
    })
});

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
router.get('/getJobById/:id', function (req, res, next) {
  let id_job = req.params.id;
  jobModel.getJobById(id_job).then(data => {
    response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
  }).catch(err => {
    response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
  })
});
//Get 10 Jobs Temporal Recent
router.get('/getTenJobsTemporalRecent', function (req, res, next) {

  jobModel.getTenJobsTemporalRecent().then(data => {
    response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
  }).catch(err => {
    response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
  })
});
//Get 10 Jobs Company Recent
router.get('/getTenJobsCompanyRecent', function (req, res, next) {

  jobModel.getTenJobsCompanyRecent().then(data => {
    response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
  }).catch(err => {
    response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
  })
});
//Get All provinces
router.get('/getProvinces/', function (req, res, next) {
  let id_job = req.params.id;
  distrinctProvinceModel.getAllProvinces().then(data => {
    response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
  }).catch(err => {
    response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
  })
});
//Get District by province
router.get('/getDistricts/:id', function (req, res, next) {
  let id_provinces = req.params.id;
  distrinctProvinceModel.getAllDisTricts(id_provinces).then(data => {
    response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
  }).catch(err => {
    response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
  })
});
//Get All tags
router.get('/getAllTags', function (req, res, next) {
  let id_provinces = req.params.id;
  tagModel.getAllTags().then(data => {
    response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
  }).catch(err => {
    response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
  })
});
module.exports = router;
