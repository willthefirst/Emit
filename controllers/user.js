var api = require('../app/api');
var https = require('https');
var http = require('http');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var api = require('../app/api');
var nodemailer = require('nodemailer');
/*
 * On succesful Google authorization
 */

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};

exports.saveGoogleAccount = function(req, res){

    if(typeof req.cookies['connect.sid'] !== 'undefined'){
        console.log(req.cookies['connect.sid']);
    }

    res.redirect('/');

    /*   Save Google contact info
      ------------------------------------------------------- */

    // Get all contacts

    var query_params = {
      access_token : '?access_token=' + api.google.access_token,
      res_type : '&alt=json',
      max_results: '&max-results=3000'
    };

    var options = {
      host: 'www.google.com',
      path: '/m8/feeds/contacts/'+ req.user.google.id +'/full/' + query_params.access_token + query_params.res_type + query_params.max_results
    };

    https.get(options, function(res){

      if(res.statusCode !== 200) {
        console.log("Response from Google API: " + res.statusCode);
        res.redirect('/error');
      }

      var json = '';

      // Add the data as it comes in to the variable 'json'.
      res.on('data', function(chunk){
        json += chunk;
      });

      // Strip that shit
      res.on('end', function(){
        //Save returned contacts from Google connect to the user's contact list
        User.findOrCreate({ 'google.id' : req.user.google.id }, function(err, user, created) {
          user.google.contacts = api.stripGoogleContacts(json);
          user.save(function(err) {
            if (err) return handleError(err);
          });
        });
      });

    }).on("error", function(e){
      console.log("Failed to gather user contacts: " + e.message);
    });
};

exports.show = function(req, res) {
  var google_contacts;

  User.findOne({ 'google.id': req.user.google.id }, function(err, user) {
    google_contacts = user.google.contacts;
    res.json(google_contacts);
  });

};

exports.sendEmail = function(req, res) {
  var smtp_options = {
      service: "Gmail",
      auth: {
          XOAuth2: {
              user: req.user.google.id,
              clientId: api.google.client_id,
              clientSecret: api.google.client_secret,
              refreshToken: req.user.google.refresh_token
          }
      }
  };

  var transport = nodemailer.createTransport("SMTP", smtp_options);

  transport.sendMail({
    from: (req.user.google.first_name + ' ' + req.user.google.last_name + '<'+ req.user.google.id + '>'),
    to: req.body.email,
    subject: "Sent with Emit",
    text: req.body.body
  }, function(error, response){
    if(error){
      res.json({
        result: "Problem: " + error
      });
    } else{
      res.json({
        result: "Message sent"
      });
    }
  });
};

// Facebook doesn't do refresh tokens, just long-lived access tokens.
exports.facebookConfig = function (req,res) {
  getFacebookToken(req, function() {
    //TODO This should render asap (probably with short-lived access token, and the long-lived should just replace the short-lived asynchornously.)
    res.redirect('/#');
    // Pass long-lived access token back to client as a cookie.
    // res.cookie('fb_tok', req.user.facebook.long_lived_token);
  });
};

function getFacebookToken(req, callback) {
  var long_lived_token;
  var options = {
    host: 'graph.facebook.com',
    path: '/oauth/access_token?grant_type=fb_exchange_token&client_id=' + api.facebook.client_id + '&client_secret=' + api.facebook.client_secret + '&fb_exchange_token=' + api.facebook.access_token
  };

  https.get(options, function(res){
    if(res.statusCode !== 200) {
      console.log("Error: Response from Facebook API: " + (res.statusCode));
      res.redirect('/error');
    }

    // Add the data as it comes in to the variable 'response'.
    res.on('data', function(chunk){
      long_lived_token += chunk;
    });

    // Save long-lived token to user's profile.
    res.on('end', function(){
      long_lived_token = long_lived_token.split('access_token=');
      long_lived_token = long_lived_token[1].split('&');
      long_lived_token = long_lived_token[0];
      User.findOrCreate({ 'facebook.id' : req.user.facebook.id } , function (err, user) {
        user.facebook.long_lived_token = long_lived_token;
        req.user.facebook.long_lived_token = long_lived_token;
        user.save(function(err){
          if (err) return handleError(err);
        });
      });

      callback();
    });
  });
}

exports.getFacebookContacts = function() {

  // Add "Facebook Timeline" to user's contacts.


  // Add users Facebook friends to currently existing contacts.

};

exports.handleFacebookContact = function(req, res) {

}
