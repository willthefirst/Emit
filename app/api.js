// Configure Google strategy
// https://github.com/jaredhanson/passport-google-oauth
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var RememberMeStrategy = require('passport-remember-me').Strategy;

// Google API params
var google_params = {
	client_id : '363206404232.apps.googleusercontent.com',
	client_secret : 'Dnd6HuZBwpZnh6XNF1Pgyx2h',
	access_token : ''
};

exports.google = google_params;

// Google Passport strategy
exports.googlePassport = function(passport) {

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user); // Now req.user == user
    });
  });

  // Google OAuth2 variables
  passport.use(new GoogleStrategy({
      clientID: google_params.client_id,
      clientSecret: google_params.client_secret,
      callbackURL: "http://localhost:3000/user/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      google_params.access_token = accessToken;
      User.findOrCreate({ 'google.id' : profile._json.email } , function (err, user) {
        user.google.refresh_token = refreshToken;
        user.save(function(err) {
          if (err) return handleError(err);
        });
        return done(err, user);
      });
    }
  ));

  passport.use(new RememberMeStrategy(
    function(token, done) {
      Token.consume(token, function (err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        return done(null, user);
      });
    },
    function(user, done) {
      var token = utils.generateToken(64);
      Token.save(token, { userId: user.id }, function(err) {
        if (err) { return done(err); }
        return done(null, token);
      });
    }
  ));
};

// Returns Google contacts name and emails in array
exports.stripGoogleContacts = function(json) {
  var contacts = JSON.parse(json);
  var contacts_list = contacts.feed.entry;

  // Creates the contact object
  function contact( user_name, user_email ) {
    this.label = user_name;
    this.value = user_email;
  }

  // Empty array to be returned
  var contacts_arr = [];
  var obj;
  var current_contact;

  // For every contact in the returned list
  for (var key in contacts_list) {
    obj = contacts_list[key];
    current_contact = new contact();

     // Loop through single contacts properties
     for (var prop in obj) {

        // important check that this is objects own property
        // not from prototype prop inherited
        if(obj.hasOwnProperty(prop)){
          if (prop === 'title') {
            current_contact.label = obj[prop]['$t'];
          }
          else if (prop === 'gd$email') {
            current_contact.value = obj[prop]['0']['address'];
          }
        }
     }
    // Don't add the contacts with a null email address
    if (current_contact.value != null) {
      contacts_arr.push(current_contact);
    }
  }
  return contacts_arr;
};