/**
 * Module dependencies.
 */

var express = require('express');
var UserModel = require('./models/User');
var AccountModel = require('./models/Accounts');
var routes = require('./app/routes.js');
var api = require('./app/api.js');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');

var app = express();

// All environments
app.set('views', __dirname + '/views');
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set("view options", { layout: false });
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session(
	{ secret: 'spunkydelicious',
	  cookie : {
	    maxAge: (3600000*24*7) // 1 week
	  }
	}
));
app.use(passport.initialize());
app.use(passport.session());
app.use(require('express-jquery')('/jquery.js'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(app.router);


var mongoose_uri;
app.use(express.errorHandler());

// development only
app.configure('development', function(){
	console.log('Were in development');
	// set the db to the local one
	mongoose_uri = 'mongodb://localhost/emit';
});

// production only
app.configure('production', function(){
	console.log('Were in production');
	mongoose_uri = process.env.MONGOLAB_URI;
});

// Connect to the db

mongoose.connect( mongoose_uri, function (err, res) {
  if (err) {
    console.log ('ERROR connecting to: ' + mongoose_uri + '. ' + err);
  } else {
    console.log ('Succeeded connecting to: ' + mongoose_uri);
  }
});

// Set up passport
api.serialize(passport);
api.googlePassport(passport);
api.facebookPassport(passport);

// Set up routing
routes.initialize(app);

// Spin up the server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});