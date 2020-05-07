var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/allUsers', function(req, res, next) {
  console.log("go inside");
  res.send('respond with pass token');
});

module.exports = router;
