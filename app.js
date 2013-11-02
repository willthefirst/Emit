/**
 * Module dependencies.
 */

var express = require('express');
var UserModel = require('./models/User');
var routes = require('./app/routes.js');
var api = require('./app/api.js');
var http = require('http');
var path = require('path');
var nodemailer = require('nodemailer');
var mongoose = require('mongoose');
var passport = require('passport');

var app = express();

// All environments
app.set('views', path.join(__dirname, 'views'));
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set("view options", { layout: false });
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('express-jquery')('/jquery.js'));

// Development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());

  // set the db to the local one
  var mongoose_uri = 'mongodb://localhost/emit';
}

// Connect to the db
mongoose.connect( mongoose_uri );
mongoose.connection.on('open', function(){
  console.log("Connected to Mongoose") ;
});

// Set up passport
api.googlePassport(passport);

// Set up routing
routes.initialize(app);

// Spin up the server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});