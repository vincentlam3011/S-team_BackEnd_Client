var express = require('express');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
const saltRounds = 15;
var redis = require('../utils/redis');
const https = require('https');

var userModel = require('../models/userModel');
var jobTopicModel = require('../models/jobTopicModel');
var jobModel = require('../models/jobModel');
var districtProvinceModel = require('../models/districtProvinceModel');
var tagModel = require('../models/tagModel');

var transactionModel = require('../models/transactionModel');

var convertBlobB64 = require('../middleware/convertBlobB64');
var momoService = require('../middleware/momoService');

var router = express.Router();
var _ = require('lodash')

var { response, DEFINED_CODE } = require('../config/response');
var { mailer } = require('../utils/nodemailer');
const acceptedModel = require('../models/acceptedmodel');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

//Get Jobs Topic
router.get('/allJobsTopics', function (req, res, next) {
  jobTopicModel.getAllJobTopics().then(data => {
    // console.log('dataJobTopic:', data)
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

// Get Jobs
router.post('/getJobsList', function (req, res, next) {
  let page = Number.parseInt(req.body.page) || 1;
  let take = Number.parseInt(req.body.take) || 6;
  let isASC = Number.parseInt(req.body.isASC) || 1;
  // Lấy danh sách các query cần thiết
  let queryArr = [];
  let multiTags = [];
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
      else if (i === 'tags') {
        multiTags = query[i];
      }
      else {
        queryArr.push({ field: i, text: `= ${query[i]}` });
      }
    }
  };
  jobModel.getJobsList(queryArr, multiTags).then(data => {
    const jobs = _.groupBy(data, "id_job");
    var finalData = [];
    let tags_temp = [];
    _.forEach(jobs, (value, key) => {
      const tags = _.map(value, item => {
        const { id_tag, tag_name, tag_status } = item;
        if (id_tag === null || tag_name === null || tag_status === 0) {
          // return null;
        }
        else {
          // return { id_tag, tag_name };
          tags_temp.push({ id_tag, tag_name });
        }
      })
      const temp = {
        id_job: value[0].id_job,
        // employer: value[0].employer,
        relevance: value[0].relevance,
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
        tags: tags_temp[0] === null ? [] : tags_temp,
      }
      finalData.push(temp);
    })
    // Đảo ngược chuỗi vì id_job thêm sau cũng là mới nhất
    if (isASC !== 1) {
      finalData = finalData.reverse();
    }
    if (multiTags.length > 0) {
      finalData = _.orderBy(finalData, 'relevance', 'desc');
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

    response(res, DEFINED_CODE.GET_DATA_SUCCESS, { jobList: realData, total: finalData.length, page: page });

  }).catch((err) => {
    response(res, DEFINED_CODE.GET_DATA_FAIL, err);
  })
});


// Get Jobs for IOS
router.post('/getJobPostListForIOS', function (req, res, next) {
  let take = Number.parseInt(req.body.take) || 6;
  let job_type = Number.parseInt(req.body.job_type) || 0;

  jobModel.getJobPostListForIOS(job_type).then(data => {
    let finalData = _.orderBy(data, 'post_date', 'desc');
    let realData = finalData.slice(0, take);
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
    response(res, DEFINED_CODE.GET_DATA_SUCCESS, { jobList: realData });

  }).catch((err) => {
    response(res, DEFINED_CODE.GET_DATA_FAIL, err);
  })
});

// Get Job Topics for IOS
router.get('/getJobTopicsForIOS', function (req, res, next) {
  jobTopicModel.getJobTopicsForIOS().then(data => {
    if (data.length > 0) {
      response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
    }
    else {
      response(res, DEFINED_CODE.GET_DATA_SUCCESS, { note: "No data" });
    }

  }).catch((err1) => {
    response(res, DEFINED_CODE.GET_DATA_FAIL, err1);
  })
});


/* Get a user's info (limited) */
router.get('/profile/:id', (req, res, next) => {
  var id_user = req.params.id;
  userModel.getUserInfo(id_user)
    .then(data => {
      var personalInfo = data[0];
      var companyInfo = data[1];
      if (personalInfo[0].avatarImg !== null) {
        let avatar = personalInfo[0].avatarImg;
        let buffer = new Buffer(avatar);
        let bufferB64 = buffer.toString('base64');
        personalInfo[0].avatarImg = bufferB64;
      }
      let limitedInfo = {
        id_user: personalInfo[0].id_user,
        fullname: personalInfo[0].fullname,
        dob: personalInfo[0].dob,
        email: personalInfo[0].email,
        dial: personalInfo[0].dial,
        address: personalInfo[0].address,
        isBusinessUser: personalInfo[0].isBusinessUser,
        gender: personalInfo[0].gender,
        avatarImg: personalInfo[0].avatarImg,
        account_status: personalInfo[0].account_status,
      }
      if (personalInfo[0].isBusinessUser) {
        response(res, DEFINED_CODE.GET_DATA_SUCCESS, { personal: limitedInfo, company: companyInfo[0] });
      } else {
        response(res, DEFINED_CODE.GET_DATA_SUCCESS, { personal: limitedInfo });
      }
    }).catch(err => {
      response(res, DEFINED_CODE.GET_DATA_FAIL)
    })
})

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
        let payload = { id: user.loginUser.id_user, fullname: user.loginUser.fullname, isBusinessUser: user.loginUser.isBusinessUser, email: user.loginUser.email };
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
  console.log('email:', email)
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
            console.log('newPassword:', newPassword)
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

    var finalData;
    var tags_temp = [];
    var imgs_temp = [];

    const tags = _.groupBy(data[0], "id_tag");

    _.forEach(tags, (value, key) => {
      const tag = _.map(value, item => {
        const { id_tag, tag_name, tag_status } = item;
        if (id_tag === null || tag_name === null || tag_status === 0) {

        } else {
          tags_temp.push(tag_name);
        }
      });
    })

    data[1].forEach(element => {
      if (element.img) {
        let buffer = new Buffer(element.img);
        let bufferBase64 = buffer.toString('base64');
        element.img = bufferBase64;
        imgs_temp.push(element.img);
      }
    })

    let jobInfo = data[0][0];


    finalData = {
      id_job: jobInfo.id_job,
      employer: jobInfo.employer,
      title: jobInfo.title,
      salary: jobInfo.salary,
      job_topic: jobInfo.job_topic,
      area_province: jobInfo.area_province,
      area_district: jobInfo.area_district,
      address: jobInfo.address,
      lat: jobInfo.lat,
      lng: jobInfo.lng,
      description: jobInfo.description,
      post_date: jobInfo.post_date,
      expire_date: jobInfo.expire_date,
      dealable: jobInfo.dealable,
      job_type: jobInfo.job_type,
      isOnline: jobInfo.isOnline,
      isCompany: jobInfo.isCompany,
      vacancy: jobInfo.vacancy,
      requirement: jobInfo.requirement,
      id_status: jobInfo.id_status,
      benefit: jobInfo.benefit,
      province_name: jobInfo.province_name,
      district_name: jobInfo.district_name,
      topic_name: jobInfo.topic_name,
      name_employer: jobInfo.name_employer,
      email: jobInfo.email,
      dial: jobInfo.dial,
      name_status: jobInfo.name_status,
      start_date: jobInfo.start_date,
      end_date: jobInfo.end_date,
      salary_type: jobInfo.salary_type,
      deadline: jobInfo.deadline,
      tags: tags_temp,
      imgs: imgs_temp,
      dealers: data[2],
    }
    response(res, DEFINED_CODE.GET_DATA_SUCCESS, finalData);
  }).catch(err => {
    response(res, DEFINED_CODE.GET_DATA_FAIL, err);
  })
});

//getUserInfoNotPrivate By Id
router.get('/getUserInfoNotPrivate/:id', function (req, res, next) {
  let employer = req.params.id;
  userModel.getUserInfoNotPrivate(employer).then(data => {
    let personalInfo = data[0];
    let employee = data[1];
    let employer = data[2];
    let companyInfo = data[3];
    
    if (personalInfo[0].avatarImg !== null) {
      let avatar = personalInfo[0].avatarImg;
      let buffer = new Buffer(avatar);
      let bufferB64 = buffer.toString('base64');
      personalInfo[0].avatarImg = bufferB64;
    }

    response(res, DEFINED_CODE.GET_DATA_SUCCESS, { personal: personalInfo[0],employer: employer[0], employee: employee[0], company: companyInfo[0] });
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
  districtProvinceModel.getAllProvinces().then(data => {
    response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
  }).catch(err => {
    response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
  })
});
//Get District by province
router.get('/getDistricts/:id', function (req, res, next) {
  let id_provinces = req.params.id;
  districtProvinceModel.getAllDisTricts(id_provinces).then(data => {
    response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
  }).catch(err => {
    response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
  })
});
//Get All tags
router.get('/getAllTags', function (req, res, next) {
  tagModel.getAllTags().then(data => {
    response(res, DEFINED_CODE.GET_DATA_SUCCESS, data);
  }).catch(err => {
    console.log(err);
    // response(res, DEFINED_CODE.GET_DATA_FAIL, err);
    res.json(err);
  })
});


//Pay Momo
router.post('/transferMoneyMomoToF2L', async function (req, res1, next) {

  if (req.body) {
    let options = (await momoService.transferMoneyMomoToF2L(req.body)).options;
    let body = (await momoService.transferMoneyMomoToF2L(req.body)).body;
    console.log('options:', options)
    var req = await https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers: ${JSON.stringify(res.headers)}`);
      res.setEncoding('utf8');
      res.on('data', (body) => {
        console.log('Body');
        console.log(body);
        console.log('payURL');
        console.log(JSON.parse(body).payUrl);
        response(res1, DEFINED_CODE.GET_DATA_SUCCESS, JSON.parse(body).payUrl);

      });
      res.on('end', () => {
        console.log('No more data in response.');
      });
    });

    req.on('error', (e) => {
      console.log(`problem with request: ${e.message}`);
    });

    // write data to request body
    req.write(body);
    req.end();




  }
  else {
    response(res1, DEFINED_CODE.ERROR_ID);
  }
});
//Handle Notify on MOMO
router.post('/handleIPNMoMo', function (req, res, next) {
  console.log("body IPN MoMo: ", req.body);
  let result = req.body;
  let id_applicant = req.body.orderId.split('-')[0];
  result.id_applicant = id_applicant;
  console.log('id_applicant:', id_applicant)
  if (req.body.errorCode == 0) {
    transactionModel.insertIntoTransaction(result).then(data => {
      response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, data)
    });

  }
  else {
    response(res, DEFINED_CODE.ERROR_ID);
  }
});
//Handle Notify on MOMO
router.post('/getResultTransactions', function (req, res, next) {
  let id_applicant = req.body.id_applicant;
  console.log('id_applicant:', id_applicant)
  if (id_applicant) {
    transactionModel.getTransactionsByIdApplicant(id_applicant).then(data => {
      if(data.length>0)
      {
        response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, data)

      }
      else
      {
      response(res, DEFINED_CODE.ERROR_ID);

      }
    }).catch(err => {
      response(res, DEFINED_CODE.ERROR_ID);

    });

  }
  else {
    response(res, DEFINED_CODE.ERROR_ID);
  }
});

// get review list by job id
router.post('/getReviewListByJobId', (req, res, next) => {
  let {id_job, take, page} = req.body;  
  acceptedModel.getReviewListByJobId(id_job)
  .then(data => {
      let finalData = data.slice(take * (page - 1), take * page);
      response(res, DEFINED_CODE.GET_DATA_SUCCESS, {list: finalData, total: data.length, page: page});
  }).catch(err => {
      response(res, DEFINED_CODE.GET_DATA_FAIL, err);
  })
})

// get review list by employer id
router.post('/getReviewListByEmployerId', (req, res, next) => {
  let {employer, take, page} = req.body;  
  acceptedModel.getReviewListByEmployerId(employer)
  .then(data => {
      let finalData = data.slice(take * (page - 1), take * page);
      response(res, DEFINED_CODE.GET_DATA_SUCCESS, {list: finalData, total: data.length, page: page});
  }).catch(err => {
      response(res, DEFINED_CODE.GET_DATA_FAIL, err);
  })
})

// get review list by employee id
router.post('/getReviewListByEmployeeId', (req, res, next) => {
  let {employee, take, page} = req.body;  
  acceptedModel.getReviewListByEmployeeId(employee)
  .then(data => {
      let finalData = data.slice(take * (page - 1), take * page);
      response(res, DEFINED_CODE.GET_DATA_SUCCESS, {list: finalData, total: data.length, page: page});
  }).catch(err => {
      response(res, DEFINED_CODE.GET_DATA_FAIL, err);
  })
})


module.exports = router;
