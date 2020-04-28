var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* GET home page. */
router.post('/login', function(req, res, next) {
  let {email, password} = req.body;

  if(email === 'admin' && password === '123')
  {
    res.json({
      code: 1,
      data: {
        id: 1,
        email,
      },
      message: 'Login successfully',
      error: null,
    })
  }
  else if(email === 'admin')
  {
    res.json({
      code: 0,
      data: null,
      message: 'Wrong account',
      error: null,
    })
  }
  else
  {
    res.json({
      code: 0,
      data: null,
      message: 'Account doesnt exist',
      error: null,
    })
  }
});


module.exports = router;
