var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Google OAuth2 variables
var GOOGLE_CLIENT_ID = '363206404232.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET = 'Dnd6HuZBwpZnh6XNF1Pgyx2h',
    GOOGLE_ACCESS_TOKEN,
    GOOGLE_REFRESH_TOKEN,
    GOOGLE_USER;

// Configure Google strategy
// https://github.com/jaredhanson/passport-google-oauth

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/user/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    GOOGLE_ACCESS_TOKEN = accessToken;
    GOOGLE_REFRESH_TOKEN = refreshToken;
    GOOGLE_USER = profile._json.email;
    User.findOrCreate({ 'google.id' : GOOGLE_USER } , function (err, user) {
      return done(err, user);
    });
  }
));

// Returns Google contacts name and emails in array
var stripContacts = function(json) {
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


/*
 * Connect to Google with OAuth2.0
 */
exports.authenticate = function(req, res) {
    return passport.authenticate('google', { scope: [  'https://www.googleapis.com/auth/userinfo.profile',
                                                    'https://www.googleapis.com/auth/userinfo.email' ,
                                                    'https://mail.google.com/',
                                                    'https://www.google.com/m8/feeds'  ] ,
                                                    accessType: 'offline', approvalPrompt: 'force' } );
};

exports.connectToGoogle = function(req, res){

    // // Don't totally understand how this works, http://passportjs.org/guide/configure/
    // passport.serializeUser(function(user, done) {
    //   done(null, user.id);
    // });

    // passport.deserializeUser(function(id, done) {
    //   User.findById(id, function(err, user) {
    //     done(err, user);
    //   });
    // });

    passport.authenticate('google', { scope: [  'https://www.googleapis.com/auth/userinfo.profile',
                                                'https://www.googleapis.com/auth/userinfo.email' ,
                                                'https://mail.google.com/',
                                                'https://www.google.com/m8/feeds'  ] ,
                                                accessType: 'offline', approvalPrompt: 'force' } ,
    function(req, res){
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
    });

    // GET /auth/google/callback
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  If authentication fails, the user will be redirected back to the
    //   login page.  Otherwise, the primary route function function will be called,
    //   which, in this example, will redirect the user to the home page.
    // app.get('/auth/google/callback',
    //   passport.authenticate('google', { failureRedirect: '/test' }),
    //   function(req, res) {
    //     res.redirect('/');

    //     var query_params = {
    //       access_token : '?access_token=' + GOOGLE_ACCESS_TOKEN,
    //       res_type : '&alt=json',
    //       max_results: '&max-results=2'
    //     };

    //     // Get all contacts
    //     var options = {
    //       host: 'www.google.com',
    //       path: '/m8/feeds/contacts/'+ GOOGLE_USER +'/full/' + query_params.access_token + query_params.res_type + query_params.max_results
    //     };

    //     https.get(options, function(res){

    //       var json = '';

    //       // Add the data as it comes in to the variable 'json'.
    //       res.on('data', function(chunk){
    //         json += chunk;
    //       });

    //       // Strip that shit
    //       res.on('end', function(){

    //         //Save returned contacts from Google connect to the user's contact list
    //         User.findOrCreate({ 'google.id' : GOOGLE_USER }, function(err, user, created) {
    //           user.google.contacts = stripContacts(json);
    //           user.save(function(err) {
    //             if (err) return handleError(err);
    //           });
    //         });
    //         // console.log(typeof (stripContacts(json)));
    //       });

    //     }).on("error", function(e){
    //       console.log("Failed to gather user contacts: " + e.message);
    //     });

    //     // Spit out all of there contacts

    //     // console.log(
    //     //   'user:', GOOGLE_USER,
    //     //   'clientId:', GOOGLE_CLIENT_ID,
    //     //   'clientSecret:', GOOGLE_CLIENT_SECRET,
    //     //   'refreshToken:', GOOGLE_REFRESH_TOKEN,
    //     //   'accessToken:', GOOGLE_ACCESS_TOKEN,
    //     //   'timeout:', 3600
    //     // );

    //     var smtp_options = {
    //         service: "Gmail",
    //         auth: {
    //             XOAuth2: {
    //                 user: GOOGLE_USER,
    //                 clientId: GOOGLE_CLIENT_ID,
    //                 clientSecret: GOOGLE_CLIENT_SECRET,
    //                 refreshToken: GOOGLE_REFRESH_TOKEN,
    //                 accessToken: GOOGLE_ACCESS_TOKEN,
    //             }
    //         }
    //     };

    //     var transport = nodemailer.createTransport("SMTP", smtp_options);

    //     // transport.sendMail({
    //     //   from: "me@tr.ee",
    //     //   to: "willthefist@gmail.com",
    //     //   subject: "Hello world!",
    //     //   text: "Plaintext body"
    //     // }, function(error, response){
    //     //   if(error){
    //     //       console.log(error);
    //     //   }else{
    //     //       console.log("Message sent: " + response.message);
    //     //   }
    //     // });
    // });



};

