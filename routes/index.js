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
var _ = require('lodash')

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
      response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
    }
    else {
      response(res, DEFINED_CODE.GET_DATA_SUCCESS, { note: "No data" });
    }

  }).catch((err1) => {
    response(res, DEFINED_CODE.GET_DATA_FAIL, err1);
  })
});

// Get Jobs by Topic
router.get('/jobsByJobTopic/:id', function (req, res, next) {

  let job_topic = req.params.id;
  let page = req.query.page;
  let number = req.query.number;
  if (job_topic && page && number) {
    jobModel.getJobByIdJobTopic(job_topic, page, number).then(data => {
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
  }
  else {
    response(res, DEFINED_CODE.MISSING_FIELD_OR_PARAMS)

  }


});

//Search Jobs

// Get Province
router.get('/getAllProvinces', function (req, res, next) {
  districtProvinceModel.getAllProvinces().then(data => {
    if (data.length > 0) {
      res.json({ message: 'Get Data Success', data, code: 1 })
    }
    else {
      res.json({ message: 'Get Data Failure', data: [], code: 0 });
    }
  }).catch((err1) => {
    res.json({ message: err1, code: 0 });
  })
});

// Get Jobs by Topic
router.post('/getJobsList', function (req, res, next) {
  let page = Number.parseInt(req.body.page) || 1;
  let take = Number.parseInt(req.body.take) || 6;
  let isASC = Number.parseInt(req.body.isASC) || 1;
  // Lấy danh sách các query cần thiết
  let queryArr = [];
  let query = req.body.query;
  for (let i in query) {
    if (query[i]) {
      if (i === 'title') {
        queryArr.push({ field: i, text: `LIKE '%${query[i]}%'` });
      }
      else if (i === 'expire_date') {
        queryArr.push({ field: i, text: `= '${query[i]}'` });
      }
      else if (i === 'salary') {
        queryArr.push({ field: i, text: `>= '${query[i].bot}'` });
        if (query[i].top != 0) {
          queryArr.push({ field: i, text: `< '${query[i].top}'` });
        }
      }
      else if (i === 'vacancy') {
        queryArr.push({ field: i, text: `>= '${query[i]}'` });
      }
      else if (i === 'employer') {
        queryArr.push({ field: i, text: `= u.id_user and u.fullname = '${query[i]}'` });
      }
      else if (i === 'tag') {
        queryArr.push({field: 'id_job', text: `= jt2.id_job and jt2.id_tag = ${query[i]}`});
      }
      else {
        queryArr.push({ field: i, text: `= ${query[i]}` });
      }
    }
  };


  jobModel.getJobsList(queryArr).then(data => {
    const jobs = _.groupBy(data, "id_job");
    var finalData = [];
    _.forEach(jobs, (value, key) => {

      const tags = _.map(value, item => {
        const { id_tag, tag_name } = item;
        if (id_tag === null || tag_name === null) {
          return null;
        }
        else {
          return { id_tag, tag_name };
        }
      })

      const temp = {
        id_job: value[0].id_job,
        // employer: value[0].employer,
        title: value[0].title,
        salary: value[0].salary,
        job_topic: value[0].job_topic,
        province: value[0].province,
        district: value[0].district,
        address: value[0].address,
        lat: value[0].lat,
        lng: value[0].lng,
        description: value[0].description,
        post_date: value[0].post_date,
        expire_date: value[0].expire_date,
        dealable: value[0].dealable,
        job_type: value[0].job_type,
        isOnline: value[0].isOnline,
        isCompany: value[0].isCompany,
        vacancy: value[0].vacancy,
        // requirement: value[0].requirement,
        id_status: value[0].id_status,
        img: value[0].img,
        tags: tags[0] === null ? [] : tags,
      }
      finalData.push(temp);
    })
    // Đảo ngược chuỗi vì id_job thêm sau cũng là mới nhất
    if (isASC !== 1) {
      finalData = finalData.reverse();
    }

    let realData = finalData.slice((page - 1) * take, (page - 1) * take + take);
    if (realData.length > 0) {

      realData.forEach(element => {
        if (element.img) {
          let buffer = new Buffer(element.img);
          let bufferBase64 = buffer.toString('base64');
          element.img = bufferBase64;
        }
      });

    }
    // console.log(realData);
    response(res, DEFINED_CODE.GET_DATA_SUCCESS, { jobList: realData, count: finalData.length, page: page });

  }).catch((err) => {
    response(res, DEFINED_CODE.GET_DATA_FAIL, err);
  })
});

/* Get top rated user */
router.get('/getTopUsers', function (req, res, next) {
  userModel.getTopUsers().then(data => {
    if (data.length > 0) {
      res.json({ message: 'Get Data Success', data, code: 1 })
    }
  }).catch((err1) => {
    res.json({ message: err1, code: 0 });
  })
});


/* Get statistic */
router.get('/getStatistic', function (req, res, next) {
  let memberNum = 0, finishedJobNum = 0, applyingJobNum = 0, processingJobNum = 0;
  userModel.countUsers().then(usersData => {
    if (usersData.length > 0) // success
    {
      memberNum = usersData[0].memberNum;
      jobModel.countFinishedJob().then(finJobData => {
        if (finJobData.length > 0) // success
        {
          finishedJobNum = finJobData[0].finishedJobNum;
          jobModel.countApplyingJob().then(appJobData => {
            if (appJobData.length > 0) // success
            {
              applyingJobNum = appJobData[0].applyingJobNum;
              jobModel.countProcessingJob().then(procJobData => {
                if (procJobData.length > 0) // success
                {                  
                  console.log('processingJobNum: ', procJobData[0].processingJobNum);
                  res.json({
                    message: 'get data success',
                    code: 1,
                    data: {
                      memberNum,
                      finishedJobNum,
                      applyingJobNum,
                      proccessingJobNum: procJobData[0].processingJobNum,
                    }
                  });
                }
                else {
                  res.json({ message: 'processing num 0', code: 0 });
                }
              }).catch((err3) => {
                res.json({ message: 'processing num error', code: 0 });
              })
            }
            else {
              res.json({ message: 'applying num 0', code: 0 });
            }
          }).catch((err1) => {
            res.json({ message: 'applying num error', code: 0 });
          })
        }
        else {
          res.json({ message: 'finished num 0', code: 0 });
        }
      }).catch((err2) => {
        res.json({ message: 'finished num error', code: 0 });
      })
    }
    else {
      res.json({ message: 'member num 0', code: 0 });
    }
  }).catch((err) => {
    res.json({ message: 'member num error', code: 0 });
  })
});

// Area
router.post('/verifyAddr', (req, res, next) => {
  let { district, province } = req.body;
  let dis = {
    name: district
  };
  let pro = {
    name: province,
  }
  districtProvinceModel.addArea(pro, dis, false)
  .then(data => {
    res.json(data.results2.insertId);
  }).catch(err => {
    res.json(err);
  })
})

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
                    + `http://localhost:3000/activation/${activateToken}\n\n`
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
                + `http://localhost:3000/activation/${activateToken}\n\n`
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
router.get('/getJobById/:id', function (req, res, next) {
  let id_job = req.params.id;
  jobModel.getJobById(id_job).then(data => {
    response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
  }).catch(err => {
    response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
  })
});
//Get Jobs Temporal Recent with params = length of data want to get
router.get('/getJobsTemporalRecent/', function (req, res, next) {
  let page = req.query.page;
  let number = req.query.number;

  if (number && number >= 5 && page) {
    jobModel.getJobsTemporalRecent(number, page).then(data => {
      data.forEach(element => {
        element.img = convertBlobB64.convertBlobToB64(element.img);
      })
      response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
    }).catch(err => {
      response(res, DEFINED_CODE.GET_DATA_FAIL, err);
    })
  }
  else {
    response(res, DEFINED_CODE.MISSING_FIELD_OR_PARAMS)
  }

});
//Get Jobs Company Recent with params = length of data want to get
router.get('/getJobsCompanyRecent/', function (req, res, next) {
  let page = req.query.page;
  let number = req.query.number;

  if (number && number >= 5 && page) {
    jobModel.getJobsCompanyRecent(number, page).then(data => {
      data.forEach(element => {
        element.img = convertBlobB64.convertBlobToB64(element.img);
      })
      response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
    }).catch(err => {
      response(res, DEFINED_CODE.GET_DATA_FAIL, err);
    })
  }
  else {
    response(res, DEFINED_CODE.MISSING_FIELD_OR_PARAMS)
  }

});
//Get All provinces
router.get('/getProvinces/', function (req, res, next) {
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
