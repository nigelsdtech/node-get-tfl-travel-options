var cfg        = require('config');
var express    = require('express');
var fs         = require('fs');
var path       = require('path');
var log4js     = require('log4js');
var logger     = require('morgan');
var bodyParser = require('body-parser');

var index      = require('./routes/index');
var transportOptions = require('./routes/transportOptions');

/*
 * Logs
 */
log4js.configure(cfg.log.log4jsConfigs);

var log = log4js.getLogger(cfg.log.appName);
log.setLevel(cfg.log.level);


var app = express();

// view engine setup
app.use(logger('combined', {
  stream: fs.createWriteStream(path.join(cfg.log.logDir, 'access.log'), {flags: 'a'})
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', index);
app.use('/transportOptions', transportOptions);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);

  if (err.status >= 500) {
    res.send('Unknown system error!!');
  } else {
    res.send('Unknown service.');
  }
});

module.exports = app;
