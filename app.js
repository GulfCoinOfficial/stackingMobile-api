var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')
const sequelize  = require("./databaseConnection/db");
try {
  sequelize.authenticate()
  console.log('Connection To Database Has Been Established')
} catch (error) {
  console.log('Error Establishing Connection With Database', error)
}

var indexRouter = require('./controller/communication');
var stack = require("./controller/stackingApi");
//var swap = require("./controller/swapping");
var app = express();
app.use(cors({ origin: true }));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/communication', indexRouter);
app.use("/stacking", stack)
//app.use("/swapping", swap);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
