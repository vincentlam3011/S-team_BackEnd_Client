var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var redis = require('../utils/redis')

var userModel = require('../models/userModel');

/* GET users listing. */
router.get('/allUsers', function(req, res, next) {
  console.log("go inside");
  res.send('respond with pass token');
});

router.post('/blacklist', function (req, res, next) {
  userModel.getCurrentToken(req.user.id_user)
    .then(result => {
      redis.setKey(result[0].currentToken);
      // redis.client.setex(result[0].currentToken, 86400, result[0].currentToken);
      res.json({
        message: "Token added to blacklist",
        tokenValue: result[0].currentToken,
        code: 1,
      })
    }).catch(err => {
      res.json({
        message: "Add to blacklist failed",
        code: 0,
        error: err,
      })
    });
})
router.post('/verifyToken', function (req, res, next) {
  userModel.getCurrentToken(req.user.id_user)
    .then(result => {
      redis.getKey(result[0].currentToken)
        .then(blacklist => {
          console.log("Blacklisted: " + blacklist);
          console.log("Current: " + result[0].currentToken);
          if (blacklist === result[0].currentToken) {
            res.json({
              message: "Token expired",
              code: -1,
            })
          } else {
            res.json({
              message: "Token valid",
              code: 1,
            })
          }
        }).catch(err => {
          res.json({
            message: "Get failed",
            code: 0,
            error: err,
          })
        });
    }).catch(err => {
      res.json({
        message: "Verify failed",
        code: 0,
        error: err,
      })
    });

})

router.get('/viewKeys', (req, res, next) => {
  res.json(redis.getAll());
})
module.exports = router;
