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
            account.password = hash;
            userModel.sign_up(account, company)
              .then((data2) => {
                var activateToken = crypto.randomBytes(10).toString('hex');
                var mailOptions = {
                  subject: "Account activation",
                  text:
                    'You are receiving this because you (or someone else) have signed up to our website.\n\n'
                    + 'Please click on the following link, or paste this into your browser to complete the process:\n\n'

                    + `${activateToken}\n\n`

                    + 'If you did not request this, please ignore this email and your account will not be activate.\n',
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
      // console.log("Acc stt: " + user[0].account_status);
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

//Get Jobs By Id
router.get('/getJob/:id', function (req, res, next) {
  let id_job = req.params.id;
  jobModel.getJobById(id_job).then(data => {
    res.json({message:"Get Successfull", info: data, code: 1 });
  }).catch(err=>{
    res.json({err,code:0});
  })
});


module.exports = router;
