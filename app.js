
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var auth = require('./routes/auth');
var http = require('http');
var https = require("https");
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

// OAUTH INFO

var GOOGLE_CLIENT_ID = '363206404232.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET = 'Dnd6HuZBwpZnh6XNF1Pgyx2h',
    GOOGLE_ACCESS_TOKEN,
    GOOGLE_REFRESH_TOKEN,
    GOOGLE_USER;


app.get('/', routes.index);
app.get('/users', user.list);
app.get('/test', routes.test);

// Probably will end up using this for Facebook.

// var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

// passport.use('google', new OAuth2Strategy({
//     authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
//     tokenURL: 'https://accounts.google.com/o/oauth2/token',
//     clientID: '363206404232.apps.googleusercontent.com',
//     clientSecret: 'Dnd6HuZBwpZnh6XNF1Pgyx2h',
//     callbackURL: 'http://localhost:3000/auth/google/callback'
//   },
//   function(accessToken, refreshToken, profile, done) {
//     console.log(profile);
//     User.findOrCreate({ gmailId: profile }, function (err, user) {
//         console.log(user);
//         return done(err, user);
//     });
//   }
// ));



// // Redirect the user to the OAuth 2.0 provider for authentication.  When
// // complete, the provider will redirect the user back to the application at
// //     /auth/provider/callback
// app.get('/auth/google', passport.authenticate('google', { scope: 'email' }));

// // The OAuth 2.0 provider has redirected the user back to the application.
// // Finish the authentication process by attempting to obtain an access
// // token.  If authorization was granted, the user will be logged in.
// // Otherwise, authentication has failed.
// app.get('/auth/google/callback',
//   passport.authenticate('google', { successRedirect: '/test',
//                                       failureRedirect: '/' }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});



var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    GOOGLE_ACCESS_TOKEN = accessToken;
    GOOGLE_REFRESH_TOKEN = refreshToken;
    GOOGLE_USER = profile._json.email;
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile',
                                            'https://www.googleapis.com/auth/userinfo.email' ,
                                            'https://mail.google.com/',
                                            'https://www.google.com/m8/feeds'  ] ,
                                            accessType: 'offline', approvalPrompt: 'force' } ),
  function(req, res){
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
  });

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/test' }),
  function(req, res) {
    res.redirect('/');

    // Get all contacts
    var options = {
      host: 'www.google.com',
      path: '/m8/feeds/contacts/'+ GOOGLE_USER +'/full?access_token=' + GOOGLE_ACCESS_TOKEN
    };

    var buffer = '';

    https.get(options, function(res){
      res.on('data', function(chunk){
        buffer += chunk.toString();
        console.log(buffer);
      });
    }).on("error", function(e){
      console.log("Got error: " + e.message);
    });

    // Spit out all of there contacts

    // console.log(
    //   'user:', GOOGLE_USER,
    //   'clientId:', GOOGLE_CLIENT_ID,
    //   'clientSecret:', GOOGLE_CLIENT_SECRET,
    //   'refreshToken:', GOOGLE_REFRESH_TOKEN,
    //   'accessToken:', GOOGLE_ACCESS_TOKEN,
    //   'timeout:', 3600
    // );

    var smtp_options = {
        service: "Gmail",
        auth: {
            XOAuth2: {
                user: GOOGLE_USER,
                clientId: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                refreshToken: GOOGLE_REFRESH_TOKEN,
                accessToken: GOOGLE_ACCESS_TOKEN,
            }
        }
    };

    var transport = nodemailer.createTransport("SMTP", smtp_options);

    // transport.sendMail({
    //   from: "me@tr.ee",
    //   to: "cbisnar@gmail.com",
    //   subject: "Hello world!",
    //   text: "Plaintext body"
    // }, function(error, response){
    //   if(error){
    //       console.log(error);
    //   }else{
    //       console.log("Message sent: " + response.message);
    //   }
    // });
});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});