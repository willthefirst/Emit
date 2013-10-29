
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var auth = require('./routes/auth');
var http = require('http');
var path = require('path');
var nodemailer = require("nodemailer");
var passport = require('passport');
var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');


var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('express-jquery')('/jquery.js'));



// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
  var mongoose_uri = 'mongodb://localhost/emit';
  mongoose.connect( mongoose_uri );

  // http://mongoosejs.com/docs/index.html

  var User;

  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function callback () {

      // Set up User schema

      var userSchema = mongoose.Schema({
         gmailId: String,
         facebookId: String
      });

      userSchema.plugin(findOrCreate);

      User = mongoose.model('User', userSchema);

  });
}

/**
 * Set up Gmail mailing.
 */

// var smtp_options = {
//     service: "Gmail",
//     auth: {
//         XOAuth2: {
//             user: "363206404232@developer.gserviceaccount.com",
//             clientId: "363206404232.apps.googleusercontent.com",
//             clientSecret: "Dnd6HuZBwpZnh6XNF1Pgyx2h",
//             accessToken: "",
//             timeout: 3600
//         }
//     }
// };

// var transport = nodemailer.createTransport("SMTP", smtp_options);

// transport.sendMail({
//     from: "test@will.com",
//     to: "willthefirst@gmail.com"
// });


app.get('/', routes.index);
app.get('/users', user.list);
app.get('/test', routes.test);

var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

passport.use('google', new OAuth2Strategy({
    authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
    tokenURL: 'https://accounts.google.com/o/oauth2/token',
    clientID: '363206404232.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/userinfo.email',
    clientSecret: 'Dnd6HuZBwpZnh6XNF1Pgyx2h',
    callbackURL: 'http://localhost:3000/auth/google/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ gmailId: profile.id }, function (err, user) {
        return done(err, user);

    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Redirect the user to the OAuth 2.0 provider for authentication.  When
// complete, the provider will redirect the user back to the application at
//     /auth/provider/callback
app.get('/auth/google', passport.authenticate('google'));

// The OAuth 2.0 provider has redirected the user back to the application.
// Finish the authentication process by attempting to obtain an access
// token.  If authorization was granted, the user will be logged in.
// Otherwise, authentication has failed.
app.get('/auth/google/callback',
  passport.authenticate('google', { successRedirect: '/test',
                                      failureRedirect: '/' }));

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
