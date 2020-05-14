var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var redis = require('../utils/redis')
var bcrypt = require('bcrypt');

var { response, DEFINED_CODE } = require('../config/response');

var userModel = require('../models/userModel');

const saltRounds = 15;

/* GET users listing. */

router.get('/', function (req, res, next) {
  var token = req.headers.authorization.slice(7);
  var decodedPayload = jwt.decode(token, {
    secret: 'S_Team',
  });
  res.json(decodedPayload);
});

/* Dummy API */
router.get('/getUser', (req, res, next) => {
  var token = req.headers.authorization.slice(7);
  var decodedPayload = jwt.decode(token, {
    secret: 'S_Team',
  });
  var id_user = decodedPayload.id;
  userModel.getByID(id_user).
    then(data => {
      let avatar = data[0].avatarImg;
      let buffer = new Buffer(avatar);
      let bufferB64 = buffer.toString('base64');
      data[0].avatarImg = bufferB64;
      res.json(data);
    }).catch(err => { res.json(err) });
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
  var updates = [];
  var body = req.body;
  for (var i in body) {
    if (body[i]) {
      if (i === 'gender')
        updates.push({ field: i, value: `${body[i]}` });
      else
        updates.push({ field: i, value: `'${body[i]}'` });
    }
  };
  userModel.updateUserInfo(id_user, updates)
    .then(data => {
      response(res, DEFINED_CODE.EDIT_PERSONAL_SUCCESS, { RowChanged: data.changedRows });
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
module.exports = router;
