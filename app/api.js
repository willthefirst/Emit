// Configure Google strategy
// https://github.com/jaredhanson/passport-google-oauth
var mongoose = require('mongoose');
var User = mongoose.model('User');
var https = require('https');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook');
// var LocalStrategy = require('passport-local').Strategy;


// // Global user account

// exports.localPassport = function(passport) {
//   passport.use(new LocalStrategy(
//     function(username, done) {
//       User.findOne({ username: username }, function(err, user) {
//         if (err) { return done(err); }
//         if (!user) {
//           return done(null, false, { message: 'Incorrect username.' });
//         }
//         if (!user.validPassword(password)) {
//           return done(null, false, { message: 'Incorrect password.' });
//         }
//         return done(null, user);
//       });
//     }
//   ));
// };

// Serialize stuff one time for sessions
exports.serialize = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user); // Now req.user == user
    });
  });
};

// Google API params
var google_params = {
	client_id : '363206404232.apps.googleusercontent.com',
	client_secret : 'Dnd6HuZBwpZnh6XNF1Pgyx2h',
	access_token : ''
};

exports.google = google_params;

// Google Passport strategy
exports.googlePassport = function(passport) {

  // Google OAuth2 variables
  passport.use(new GoogleStrategy({
      clientID: google_params.client_id,
      clientSecret: google_params.client_secret,
      callbackURL: "http://localhost:3000/user/google/auth/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      google_params.access_token = accessToken;
      User.findOrCreate({ 'google.id' : profile._json.email } , function (err, user) {
        user.google.refresh_token = refreshToken;
        user.google.first_name =  profile._json.given_name;
        user.google.last_name =  profile._json.family_name;
        user.save(function(err) {
          if (err) return handleError(err);
        });
        return done(err, user);
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

var facebook_params = {
  client_id: "348612998615744",
  client_secret: "88d7cce889bd0623710ec980724a7622",
  callbackURL: "http://localhost:3000/user/facebook/auth/callback",
  access_token: '',
  long_lived_token: ''
};

exports.facebook = facebook_params;

// Google Passport strategy
exports.facebookPassport = function(passport) {

  // Facebook OAuth2 variables
  passport.use(new FacebookStrategy({
      clientID: facebook_params.client_id,
      clientSecret: facebook_params.client_secret,
      callbackURL: facebook_params.callbackURL
    },
    // For some reason, we must provide refreshToken as a param even though we never use it here.
    function(accessToken, refreshToken, profile, done) {
      facebook_params.access_token = accessToken;

      User.findOrCreate({ 'facebook.id' : profile._json.id } , function (err, user) {
        user.facebook.id =  profile._json.id;
        user.facebook.first_name =  profile._json.first_name;
        user.facebook.last_name =  profile._json.last_name;
        user.save(function(err) {
          if (err) return handleError(err);
        });
        return done(err, user);
      });
    }
  ));
};
