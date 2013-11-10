// Configure Google strategy
// https://github.com/jaredhanson/passport-google-oauth
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook');
var mongoose = require('mongoose');
var User = mongoose.model('User');

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
  callbackURL: "http://localhost:3000/auth/facebook/callback",
  access_token: '',
  long_lived_token: ''
};

exports.facebook = facebook_params;

// Google Passport strategy
exports.facebookPassport = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user); // Now req.user == user
    });
  });

  // Google OAuth2 variables
  passport.use(new FacebookStrategy({
      clientID: facebook_params.client_id,
      clientSecret: facebook_params.client_secret,
      callbackURL: facebook_params.callbackURL
    },
    function(accessToken, profile, done) {
      console.log('asdasd');
      facebook_params.access_token = accessToken;
      User.findOrCreate({ 'facebook.id' : profile._json.id } , function (err, user) {
        user.facebook.first_name =  profile._json.first_name;
        user.facebook.last_name =  profile._json.last_name;
        user.save(function(err) {
          if (err) return handleError(err);
        });
        return done(err, user);
      });
      facebookLongToken();
    }
  ));
};

// Facebook doesn't do refresh tokens, just long-lived access tokens.

exports.facebookLongToken = function() {
  console.log('here');
  var options = {
    host: 'www.facebook.com',
    path: '/oauth/access_token?grant_type=fb_exchange_token&client_id=' + facebook_params.client_id + '&client_secret=' + facebook_params.client_secret + '}&fb_exchange_token=' + facebook_params.access_token
  };

  https.get(options, function(res){
    if(res.statusCode !== 200) {
      console.log("Response from Google API: " + res.statusCode);
      res.redirect('/error');
    }
    else {
      console.log(res);
    }
  });
};
