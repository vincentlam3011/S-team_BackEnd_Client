var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var jobsRouter = require('./routes/jobs');
var applicantsRouter = require('./routes/applicants');
var acceptedRouted = require('./routes/accepted');

var app = express();
var bodyParser = require('body-parser');

require('./passport');
var verify = require('./passport');
var passport = require('passport');
var redis = require('./utils/redis');
var { validateTokenInBlacklist, passportStrategy } = require('./middleware/auth');
// app.use()


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.disable('etag');
// CORS fixed
app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});
app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))
app.use(logger('dev'));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var bodyParser = require('body-parser');

app.use('/', indexRouter);

app.use('/users', validateTokenInBlacklist, passportStrategy, usersRouter);
app.use('/jobs', validateTokenInBlacklist, passportStrategy, jobsRouter);
app.use('/applicants', validateTokenInBlacklist, passportStrategy, applicantsRouter);
app.use('/accepted', validateTokenInBlacklist, passportStrategy, acceptedRouted);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;