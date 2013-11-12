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
  callbackURL: 'http://localhost:3000/user/google/auth/callback',
	access_token : ''
};

var facebook_params = {
  client_id: "348612998615744",
  client_secret: "88d7cce889bd0623710ec980724a7622",
  callbackURL: "http://localhost:3000/user/facebook/auth/callback",
  access_token: '',
  long_lived_token: ''
};

exports.google = google_params;
exports.facebook = facebook_params;

// Google Passport strategy
exports.googlePassport = function(passport) {

  // Google OAuth2 variables
  passport.use(new GoogleStrategy({
      clientID: google_params.client_id,
      clientSecret: google_params.client_secret,
      callbackURL: google_params.callbackURL,
      pasReqToCallback: true
    },
    function(req, accessToken, refreshToken, profile, done) {
      google_params.access_token = accessToken;
      var user_exists = false;
      var user_id;

      // See if current profile is in db.
      User.findOne({ 'google.id': profile._json.email }, function(err, user) {
        if (err) return handleError(err);
        if (user) {
          user_exists = true;
          // TODO can this be refactored to just return user object (which evaluated to true anyway?)
          user_id = user.id;
        };
      });


      if (!req.user) { // LOGGED OUT: There is no user in the request. This will blindly make accounts that may be duplicative. THIS SECTION IS GOOD.

        // IF THERE IS A USER IN DB where user.google.id === profile._json.email
        if (user_exists) {
          // return that user (and thereby login with that user)
          // this could be a google-only user or a google+fb user.
          console.log('Google user already in DB, they are now logged in.');
          return done(err, user);
        }
        // ELSE -> THERE IS NO USER IN DB where user.google.id === profile._json.email
        else {
          // create a new local identity. should produce ->
            // local_id = profile._json.email
            // facebook: { nothing }
            // google : {...}
          // this will be a google-only user.
          User.create({
            local_id: profile._json.email,
            google: {
              id: profile._json.email,
              first_name: profile._json.given_name,
              last_name: profile._json.family_name,
              refresh_token: refresh_token
            }
          }, function (err, small) {
            if (err) return handleError(err);
            // saved!
          });
        }
        // return that user
        return done(null, req.user);

      } else { // LOGGED IN: There is a facebook-only user in the request. In this case, we know enough to associate multiple 3rd party acccounts.
        // TODO: the above condition assumes that the user is not already logged into google, and may fuck up if they are.

        // IF THERE IS A USER IN DB where user.google.id === profile._json.email) =
        // This means that the user has made a google account that was never associated to the current account.
        if (user_exists) {
          // remove that duplicate account. should produce ->
          User.findByIdAndRemove(user_id, function() {
            console.log('Duplicate user removed');
          });
        }
        // Now: this is a facebook-only account, sojust add the google info to this user

        // Add google info to current user's account. should produce ->
          // local_id = already exists
          // facebook: { already exists }
          // google : { ... }
        User.update({ local_id: req.user.local_id }, { $set: {
          google: {
            id: profile._json.email,
            first_name: profile._json.given_name,
            last_name: profile._json.family_name,
            refresh_token: refresh_token
          }
        }}, function() {
          console.log('We added Google info to users FB account.');
        });

        // return the user.
        return done(null, req.user);
      }
    }
  ));
};

// Google Passport strategy
exports.facebookPassport = function(passport) {

  // Facebook OAuth2 variables
  passport.use(new FacebookStrategy({
      clientID: facebook_params.client_id,
      clientSecret: facebook_params.client_secret,
      callbackURL: facebook_params.callbackURL,
      pasReqToCallback: true
    },
    // For some reason, we must provide refreshToken as a param even though we never use it here.
    function(req, accessToken, refreshToken, profile, done) {
      facebook_params.access_token = accessToken;

      if (!req.user) { // There is no user in the request
        // If there is a user with matching profile._json.id
          // return that user (and thereby login with that user)
        // If there is no user in db with a matching profile._json.id
          // create a new local identity. should produce ->
            // local_id = profile._json.id
            // facebook: { ... }
            // google : {nothing}
          // return that user
      } else { // There is a user in the request
        // Add facebook info to that user's account. should produce ->
          // local_id = already exists
          // facebook: { ... }
          // google : { already exists }
        // return the user.
        return done(null, req.user);
      }

      // User.findOrCreate({ 'facebook.id' : profile._json.id } , function (err, user) {
      //   user.facebook.id =  profile._json.id;
      //   user.facebook.first_name =  profile._json.first_name;
      //   user.facebook.last_name =  profile._json.last_name;
      //   user.save(function(err) {
      //     if (err) return handleError(err);
      //   });
      //   return done(err, user);
      // });
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