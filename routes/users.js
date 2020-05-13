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
  console.log(res);
  res.send('respond with a resource');
});

/* Dummy API */
router.get('/getUser', (req, res, next) => {
  userModel.getCompanyInfo().then(data => {
    res.json({
      message: "Get success",
      code: 1,
      info: data,
    })
  }).catch(err => {
    res.json({
      message: "Get failed",
      code: 0,
      info: err,
    })
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
    if (result) {
      bcrypt.hash(newPassword, saltRounds, (err, hash) => {
        if (err) {
          res.json(err);
        } else {
          var updates = [{field: 'password', value: `'${hash}'`}];
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

module.exports = router;
