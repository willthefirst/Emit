
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var nodemailer = require("nodemailer");

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('express-jquery')('/jquery.js'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


/**
 * Set up Gmail mailing.
 */

var smtp_options = {
    service: "Gmail",
    auth: {
        XOAuth2: {
            user: "363206404232@developer.gserviceaccount.com",
            clientId: "363206404232.apps.googleusercontent.com",
            clientSecret: "Dnd6HuZBwpZnh6XNF1Pgyx2h",
            accessToken: "",
            timeout: 3600
        }
    }
};

var transport = nodemailer.createTransport("SMTP", smtp_options);

transport.sendMail({
    from: "test@will.com",
    to: "willthefirst@gmail.com"
});


app.get('/', routes.index);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
