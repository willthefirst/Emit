// Configure Google strategy
// https://github.com/jaredhanson/passport-google-oauth
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Google API params
var google_params = {
	client_id : '363206404232.apps.googleusercontent.com',
	client_secret : 'Dnd6HuZBwpZnh6XNF1Pgyx2h',
	access_token : '',
	refresh_token: '',
	user: ''
};

exports.google = google_params;

// Google Passport credentials
exports.googlePassport = function(passport) {
  // Google OAuth2 variables
  passport.use(new GoogleStrategy({
      clientID: google_params.client_id,
      clientSecret: google_params.client_secret,
      callbackURL: "http://localhost:3000/user/auth/google/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      console.log("AcessToken: "+ accessToken);
      google_params.access_token = accessToken;
      google_params.refresh_token = refreshToken;
      google_params.user = profile._json.email;
      User.findOrCreate({ 'google.id' : google_params_user } , function (err, user) {
        return done(err, user);
      });
    }
  ));
  // Don't totally understand how this works, http://passportjs.org/guide/configure/
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
};

// Returns Google contacts name and emails in array
exports.stripGoogleContacts = function(json) {
  var contacts = JSON.parse(json);
  var contacts_list = contacts.feed.entry;

  // Creates the contact object
  function contact( user_name, user_email ) {
    this.name = user_name;
    this.email = user_email;
  }

  // Empty array to be returned
  var contacts_arr = [];

  // For every contact in the returned list
  for (var key in contacts_list) {

     var obj = contacts_list[key];
     var current_contact = new contact();

     // Loop through single contacts properties
     for (var prop in obj) {

        // important check that this is objects own property
        // not from prototype prop inherited
        if(obj.hasOwnProperty(prop)){
          if (prop === 'title') {
            current_contact.name = obj[prop]['$t'];
          }
          else if (prop === 'gd$email') {
            current_contact.email = obj[prop]['0']['address'];
          }
        }
     }
    contacts_arr.push(current_contact);
  }
  return contacts_arr;
};