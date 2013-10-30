
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
         google : {
          id: String,
          contacts: Array
         }
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

// Google contacts

// // Save contacts returned from Contacts API
// app.post('/google/contacts', routes.);

// // Get contacts for autocomplete
// app.get('/google/contacts', routes.gcontacts);


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var contacts = '';

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    GOOGLE_ACCESS_TOKEN = accessToken;
    GOOGLE_REFRESH_TOKEN = refreshToken;
    GOOGLE_USER = profile._json.email;
    User.findOrCreate({ google : {id : GOOGLE_USER }}, function (err, user) {
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

    var query_params = {
      access_token : '?access_token=' + GOOGLE_ACCESS_TOKEN,
      res_type : '&alt=json',
      max_results: '&max-results=100'
    };

    // Get all contacts
    var options = {
      host: 'www.google.com',
      path: '/m8/feeds/contacts/'+ GOOGLE_USER +'/full/' + query_params.access_token + query_params.res_type + query_params.max_results
    };

    console.log(options.path);

    https.get(options, function(res){
      res.on('data', function(chunk){
        contacts += chunk.toString();
        console.log('Contacts:', contacts);
        // console.log(User);
      });
    }).on("error", function(e){
      console.log("Failed to gather user contacts: " + e.message);
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