var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var redis = require('../utils/redis')
var bcrypt = require('bcrypt');

var { response, DEFINED_CODE } = require('../config/response');

var passport = require('../passport');

var userModel = require('../models/userModel');
const reportModel = require('../models/reportModel');
const transactionModel = require('../models/transactionModel');
const { transaction } = require('../utils/db');
const { report } = require('./applicants');

var firebase = require('../middleware/firebaseFunction')
const saltRounds = 15;

/* GET users listing. */

router.get('/', function (req, res, next) {

  var token = req.headers.authorization.slice(7);
  var decodedPayload = jwt.decode(token, {
    secret: 'S_Team',
  });
  res.json(decodedPayload);
});

/* Get user info */
router.get('/me', (req, res, next) => {
  var token = req.headers.authorization.slice(7);
  var decodedPayload = jwt.decode(token, {
    secret: 'S_Team',
  });
  var id_user = decodedPayload.id;
  userModel.getUserInfo(id_user)
    .then(data => {
      var personalInfo = data[0];
      var companyInfo = data[1];
      // avatar
      if (personalInfo[0].avatarImg !== null) {
        let avatar = personalInfo[0].avatarImg;
        let buffer = new Buffer(avatar);
        let bufferB64 = buffer.toString('base64');
        personalInfo[0].avatarImg = bufferB64;
      }
      // portrait
      if (personalInfo[0].portrait !== null) {
        let portrait = personalInfo[0].portrait;
        let buffer = new Buffer(portrait);
        let bufferB64 = buffer.toString('base64');
        personalInfo[0].portrait = bufferB64;
      }
      // front ID
      if (personalInfo[0].frontIdPaper !== null) {
        let frontIdPaper = personalInfo[0].frontIdPaper;
        let buffer = new Buffer(frontIdPaper);
        let bufferB64 = buffer.toString('base64');
        personalInfo[0].frontIdPaper = bufferB64;
      }
      // back ID
      if (personalInfo[0].backIdPaper !== null) {
        let backIdPaper = personalInfo[0].backIdPaper;
        let buffer = new Buffer(backIdPaper);
        let bufferB64 = buffer.toString('base64');
        personalInfo[0].backIdPaper = bufferB64;
      }
      if (personalInfo[0].isBusinessUser) {
        response(res, DEFINED_CODE.GET_DATA_SUCCESS, { personal: personalInfo[0], company: companyInfo[0] });
      } else {
        response(res, DEFINED_CODE.GET_DATA_SUCCESS, { personal: personalInfo[0] });
      }
    }).catch(err => {
      response(res, DEFINED_CODE.GET_DATA_FAIL)
    })
})

/* Check if there is any job that expired today */
router.get('/checkExpiredJob', (req, res, next) => {
  var token = req.headers.authorization.slice(7);
  var decodedPayload = jwt.decode(token, {
    secret: 'S_Team',
  });
  var id_user = decodedPayload.id;

  userModel.getExpireJobList(id_user)
    .then(data => {
      let applyingJob = data[0]; // công việc đang tuyển
      let proccessingJob = data[1]; // công việc đang thực hiện

      if (applyingJob.length === 0 && proccessingJob === 0) {
        response(res, DEFINED_CODE.GET_DATA_SUCCESS, { code: 0 }); // ko có công việc quá hạn
      }
      else {
        let numOfApplying = applyingJob.length, numOfProccessing = proccessingJob.length;
        let returnStt = 0; // không có cv hết hạn
        if (applyingJob.length > 0) {
          console.log('hello from applying');
          userModel.setExpireApplyingJobToProccessing(id_user)
            .then(applyingData => {
              console.log('hello from applying 2');
            })
            .catch(err => {
              response(res, DEFINED_CODE.GET_DATA_FAIL, err)
            })
        }

        if (proccessingJob.length > 0) { // kết thúc các công việc đang làm mà hết hạn
          console.log('hello from proccessing');
          userModel.setFinishJob(id_user)
            .then(processData => {

              let content = {
                fullname: processData[0][0].fullname,
                job: '',
                type: 2,
                date: Date.now()
              }
              processData[1].forEach(e => {
                content.job = e.title;
                firebase.pushNotificationsFirebase(e.email, content);
              });


            })
            .catch(err => {
              response(res, DEFINED_CODE.GET_DATA_FAIL, err)
            })
        }

        if(numOfApplying > 0 && numOfProccessing > 0) {
          returnStt = 3;
        }
        else if(numOfApplying > 0 && numOfProccessing === 0) {
          returnStt = 1;
        }
        else if(numOfApplying === 0 && numOfProccessing > 0) {
          returnStt = 2;
        }
        else {
          returnStt = 0;
        }
        console.log('hello final');
        response(res, DEFINED_CODE.GET_DATA_SUCCESS, { code: returnStt });
      }
    }).catch(err => {
      response(res, DEFINED_CODE.GET_DATA_FAIL, err)
    })
})


/* Change password */
router.put('/changePassword', (req, res, next) => {
  var token = req.headers.authorization.slice(7);
  var decodedPayload = jwt.decode(token, {
    secret: 'S_Team',
  });
  var id_user = decodedPayload.id;
  var newPassword = req.body.new_password;
  var oldPassword = req.body.old_password;
  console.log(req.user.password);
  bcrypt.compare(oldPassword, req.user.password, (err, result) => {
    if (err) {
      response(res, DEFINED_CODE.CHANGE_PASSWORD_FAIL, err);
    }
    if (result) {
      bcrypt.hash(newPassword, saltRounds, (err, hash) => {
        if (err) {
          res.json(err);
        } else {
          var updates = [{ field: 'password', value: `'${hash}'` }];
          userModel.updateUserInfo(id_user, updates)
            .then(data => {
              redis.setKey(token);
              response(res, DEFINED_CODE.CHANGE_PASSWORD_SUCCESS);
            }).catch(err => {
              response(res, DEFINED_CODE.ACCESS_DB_FAIL, err);
            })
        }
      })
    } else {
      response(res, DEFINED_CODE.CHANGE_PASSWORD_FAIL, `Change password failed!`);
    }
  })
})

/* Update profile (personal)*/
router.put('/editPersonalInfo', (req, res, next) => {
  var token = req.headers.authorization.slice(7);
  var decodedPayload = jwt.decode(token, {
    secret: 'S_Team',
  });
  var id_user = decodedPayload.id;
  console.log("id user: ", id_user);
  var updates = [];
  var body = req.body;
  for (var i in body) {
    if (body[i]) {
      if (i != 'email' && i != 'password') {
        if (i === 'gender')
          updates.push({ field: i, value: `${body[i]}` });
        else
          updates.push({ field: i, value: `'${body[i]}'` });
      }
    }
  };
  userModel.updateUserInfo(id_user, updates)
    .then(data => {
      response(res, DEFINED_CODE.EDIT_PERSONAL_SUCCESS, { RowChanged: data.changedRows, });
    }).catch(err => {
      response(res, DEFINED_CODE.EDIT_PERSONAL_FAIL, err);
    })
})

/* Update profile (company) */
router.put('/editCompanyInfo', (req, res, next) => {
  var token = req.headers.authorization.slice(7);
  var decodedPayload = jwt.decode(token, {
    secret: 'S_Team',
  });
  var id_user = decodedPayload.id;
  if (!decodedPayload.isBusinessUser) {
    response(res, DEFINED_CODE.EDIT_COMPANY_FAIL, { RowChanged: 0, Note: 'Not a business user' });
    return;
  }
  var updates = [];
  var body = req.body;
  for (var i in body) {
    if (body[i]) {
      if (i === 'number_of_employees')
        updates.push({ field: i, value: `${body[i]}` });
      else
        updates.push({ field: i, value: `'${body[i]}'` });
    }
  };
  userModel.updateCompanyInfo(id_user, updates)
    .then(data => {
      response(res, DEFINED_CODE.EDIT_COMPANY_SUCCESS, { RowChanged: data.changedRows });
    }).catch(err => {
      response(res, DEFINED_CODE.EDIT_COMPANY_FAIL, err);
    })
})

router.post('/addReport', (req, res, next) => {

  var token = req.headers.authorization.slice(7);
  var decodedPayload = jwt.decode(token, {
    secret: 'S_Team',
  });

  let id_user1 = decodedPayload.id;
  let { content, type, applicantId, id_job } = req.body;
  let role1 = Number.parseInt(req.body.yourRole);
  let role2 = 0;
  if (role1 === 0) {
    role2 = 1;
  }

  let id_user2 = Number.parseInt(req.body.reporterId);

  reportModel.getReportByAppIdJobIdU1U2Type(id_user1, id_user2, type, applicantId, id_job)
    .then(checkData => {
      if (checkData.length > 0) { // đã tồn tại
        if (checkData[0].status === 0) { // chưa giải quyết
          reportModel.updateContentReport(id_user1, id_user2, content, type, applicantId, id_job)
            .then(data => {
              response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, { code: 1 });
            }).catch(err => {
              response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);
            })
        }
        else { // đã giải quyết
          response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, { code: 0 });
        }
      }
      else { // chưa tồn tại
        reportModel.addReport(id_user1, role1, id_user2, role2, content, type, applicantId, id_job)
          .then(data => {
            response(res, DEFINED_CODE.INTERACT_DATA_SUCCESS, { code: 1 });
            if (type === 1) { // yêu cầu sa thải
              let content1 = {
                fullname: data[1][0].fullname,
                job: data[1][0].title,
                type: 21,
                date: Date.now()
              }
              firebase.pushNotificationsFirebase(data[1][0].email, content1);
            }
            else { // khiếu nại thông thường
              let content2 = {
                fullname: data[1][0].fullname,
                job: data[1][0].title,
                type: 20,
                date: Date.now()
              }
              firebase.pushNotificationsFirebase(data[1][0].email, content2);
            }
          }).catch(err => {
            response(res, DEFINED_CODE.INTERACT_DATA_FAIL, err);
          })
      }
    })
})


/* Get user info */
router.post('/getTransactionsByIdUser', (req, res, next) => {
  let take = Number.parseInt(req.body.take) || 8;
  let page = Number.parseInt(req.body.page) || 1;
  var token = req.headers.authorization.slice(7);
  var decodedPayload = jwt.decode(token, {
    secret: 'S_Team',
  });
  var id_user = decodedPayload.id;
  transactionModel.getTransactionsByIdUser(id_user)
    .then(data => {
      var transactionList = data[0];
      transactionList.forEach((e) => {
        if (e.avatarImg !== null) {
          let avatar = e.avatarImg;
          let buffer = new Buffer(avatar);
          let bufferB64 = buffer.toString('base64');
          e.avatarImg = bufferB64;
        }
      })

      let final = transactionList.slice(take * (page - 1), take * page);
      var sum = data[1][0];
      response(res, DEFINED_CODE.GET_DATA_SUCCESS, { list: final, page: page, total: transactionList.length, sum: sum.totalAmount });

    }).catch(err => {
      response(res, DEFINED_CODE.GET_DATA_FAIL)
    })
})


module.exports = router;
