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

            // Save new access token to google_params for later use.
            google_params.access_token = token;

            // If there is a user in the session
            if (req.user) {

                // Look for an account with google profile in DB
                Accounts.findOne({
                    'google.id': profile._json.email
                }, function(err, account) {

                    // If the google account already exists in DB:
                    if (account) {
                        // Then user has authenticated before with Google but never tied it to the user account.
                        // So: let's update the old account (as to destroy other 3rd party information): update info (might as well), and tie to user.

                        Accounts.findByIdAndUpdate(account.id, {
                            userId: req.user.username,
                            google: {
                                id: profile._json.email,
                                first_name: profile._json.given_name,
                                last_name: profile._json.family_name,
                                refresh_token: refreshToken
                            }
                        }, function(err, account) {
                            if (err) {
                                console.log('Error:', err);
                                return handleError(err);
                            }
                            console.log('Duplicate found, so we updated the account and tied it to the user.');

                            // Supply current user back to session
                            return done(null, account);
                        });
                    }
                    // Else, if current Google account doesn't exist in DB.
                    else {
                        // This is the first time this person is authenticating with Google, so easy: just tie it to their user account.
                        Accounts.create({
                            userId: req.user.username,
                            google: {
                                id: profile._json.email,
                                first_name: profile._json.given_name,
                                last_name: profile._json.family_name,
                                refresh_token: refreshToken
                            }
                        }, function(err, account) {
                            if (err) {
                                console.log('Error:', err);
                                return handleError(err);
                            }
                            console.log('No duplicates found, so we will save the new Google account and tie it to the user');

                            // Supply current user back to session
                            return done(null, account);
                        });
                    }
                });
            }

            // Else (no user in session)
            else {

                Accounts.findOne({
                    'google.id': profile._json.email
                }, function(err, account) {
                    if (err) {
                        console.log('Error:', err);
                    }

                    // If account is already in DB
                    if (account) {

                        // If 3rd party account is not associated with a user.
                        if (!account.userId) {

                            console.log('Account exists already in DB, but not tied to a user. Authenticating.');

                            // Then return it.
                            return done(null, account);
                        }

                        // Else if it IS associated with a user
                        else {
                            //set the req.user to the associated user
                            User.findOne({
                                'username': account.userId
                            }, function(err, user) {
                                req.user = user;
                                return done(null, req.user);
                            });
                        }
                    }

                    // Else if account is NOT in DB.
                    else {
                        // Fresh new Google account, NOT tied to any user.
                        Accounts.create({
                            google: {
                                id: profile._json.email,
                                first_name: profile._json.given_name,
                                last_name: profile._json.family_name,
                                refresh_token: refreshToken
                            }
                        }, function(err, account) {
                            if (err) {
                                console.log('Error:', err);
                                return handleError(err);
                            }
                            console.log('New account saved but NOT tied to any user.');

                            // Supply current user back to session
                            return done(null, account);
                        });
                    }
                });
            }
        })
    );
};

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

            User.findOrCreate({
                'facebook.id': profile._json.id
            }, function(err, user) {
                user.facebook.id = profile._json.id;
                user.facebook.first_name = profile._json.first_name;
                user.facebook.last_name = profile._json.last_name;
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