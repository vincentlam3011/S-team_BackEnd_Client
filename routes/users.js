var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var redis = require('../utils/redis')

var passport = require('../passport');

var userModel = require('../models/userModel');

/* GET users listing. */

router.get('/', function (req, res, next) {
  console.log(res);
  // res.send('respond with a resource');
  // res.json(req.headers.authorization.slice(7));
  res.json(req.user);
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
module.exports = router;
