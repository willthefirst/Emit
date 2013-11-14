// Configure Google strategy
// https://github.com/jaredhanson/passport-google-oauth
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Accounts = mongoose.model('Accounts');
var https = require('https');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook');
var LocalStrategy = require('passport-local').Strategy;


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

// Global user account

exports.localPassport = function(passport) {
    passport.use(new LocalStrategy(
        function(username, password, done) {
            User.findOne({
                username: username
            }, function(err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    console.log('incorrect username');
                    return done(null, false, {
                        message: 'Incorrect username.'
                    });
                }
                if (user.password !== password) {
                    console.log('incorrect password');
                    return done(null, false, {
                        message: 'Incorrect password.'
                    });
                }
                return done(null, user);
            });
        }
    ));
};

// Google API params
var google_params = {
    client_id: '363206404232.apps.googleusercontent.com',
    client_secret: 'Dnd6HuZBwpZnh6XNF1Pgyx2h',
    callbackURL: 'http://localhost:3000/user/google/auth/callback',
    access_token: ''
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
            passReqToCallback: true
        },
        function(req, token, refreshToken, profile, done) {

            userHandler( 'google', req, token, refreshToken, profile, done );

        })
    );
};

// Google Passport strategy
exports.facebookPassport = function(passport) {

    // Facebook OAuth2 variables
    passport.use(new FacebookStrategy({
            clientID: facebook_params.client_id,
            clientSecret: facebook_params.client_secret,
            callbackURL: facebook_params.callbackURL,
            passReqToCallback: true
        },
        // For some reason, we must provide refreshToken as a param even though we never use it here.

        function(req, accessToken, refreshToken, profile, done) {

            userHandler( 'facebook', req, accessToken, null, profile, done );

        }
    ));
};

function userHandler( type, req, token, refreshToken, profile, done ) {

    var id_query = {},
        new_account = {},
        update_account = {},
        new_user = {},
        params;

    switch (type) {
        case "facebook" :

            id_query = {
                'facebook.id': profile._json.id,
            };

            new_account =  {
                userId: profile._json.id,

                facebook: {
                    id: profile._json.id,
                    first_name: profile._json.first_name,
                    last_name: profile._json.last_name
                }
            };

            update_account = {
                facebook: {
                    id: profile._json.id,
                    first_name: profile._json.first_name,
                    last_name: profile._json.last_name
                }
            };

            new_user = {
                username: profile._json.id ,
                facebookConnected: true,
            };

            params = facebook_params;

        break;

        case "google" :

            id_query = {
                'google.id': profile._json.email,
            };

            new_account =  {
                userId: profile._json.email,

                google: {
                    id: profile._json.email,
                    first_name: profile._json.given_name,
                    last_name: profile._json.family_name,
                    refresh_token: refreshToken

                }
            };

            update_account = {
                google: {
                    id: profile._json.email,
                    first_name: profile._json.given_name,
                    last_name: profile._json.family_name,
                    refresh_token: refreshToken
                }
            };

            new_user = {
                username: profile._json.email ,
                googleConnected: true,
            };

            params = google_params;

        break;
    }

    params.access_token = token;

    // If no tmpuser in session: Authentication situation
    if (!req.session.tmpUser) {
        console.log('No tmpUser in session: Authenticating:');

        Accounts.findOne(id_query, function(err, account) {
            // If Facebook account is already in DB -> Old user
            if (account) {
                // Send the associated tmpUser back to the session.
                User.findOne({
                    'username': new_account.userId
                }, function(err, user) {
                    console.log(type + ' account found in DB: returning associated user.');
                    req.session.tmpUser = user;
                    return done(null, account);
                });
            }
            // Else -> New user
            else {
                console.log(type + ' account NOT in DB: created new account');

                // Add the account to the DB
                Accounts.create(new_account, function(err, account) {
                    if (err) {
                        console.log('Error:', err);
                        return handleError(err);
                    }
                    console.log('New account created.');
                    // tie to a new tmpUser
                    User.create( new_user, function(err, user, created) {
                        if(err) console.log('user is not saved');
                        console.log('New ' + type + ' account tied to new user.');

                        // send tmpUser back to the session.
                        req.session.tmpUser = user;

                        // Then return account.
                        return done(null, account);
                    });

                });
            }
        });

    }
    // Else if there is a tmpUser in session: Authorization situation
    else {
        console.log('tmpUser exists in session');
        // Then at least one account must be connected and associated with tmp user (google or facebook)
        Accounts.findOneAndUpdate({ userId : req.session.tmpUser.username }, update_account, function(err, account) {
            if (err) {
                console.log('Error:', err);
                return handleError(err);
            }

            console.log('tmpUser account has been updated with ' + type +  ' information.');

            // Supply current user back to session
            return done(null, account);
        });
    }
};


// Returns Google contacts name and emails in array
exports.stripGoogleContacts = function(json) {
    var contacts = JSON.parse(json);
    var contacts_list = contacts.feed.entry;

    // Creates the contact object

    function contact(user_name, user_email) {
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
            if (obj.hasOwnProperty(prop)) {
                if (prop === 'title') {
                    current_contact.label = obj[prop]['$t'];
                } else if (prop === 'gd$email') {
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