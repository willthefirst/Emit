
/*
 * Authenticate things
 */

exports.google = function(req, res){

    var token = "not set";

    // http://passportjs.org/guide/oauth/
    var passport = require('passport'), OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

    passport.use('google', new OAuth2Strategy({
        authorizationURL: 'https://accounts.google.com/o/oauth2/auth',
        tokenURL: 'https://accounts.google.com/o/oauth2/token',
        clientID: '363206404232.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/userinfo.email',
        clientSecret: 'Dnd6HuZBwpZnh6XNF1Pgyx2h',
        callbackURL: 'http://localhost:3000/'
      },
      function(accessToken, refreshToken, profile, done) {
        token = accessToken;
        res.render('google', { token: token });
      }
    ));

};