var api = require('../app/api');
var https = require('https');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var api = require('../app/api');
var nodemailer = require('nodemailer');
/*
 * On succesful Google authorization
 */
exports.saveGoogleAccount = function(req, res){

    req.session.property = 'Logged in';

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
      max_results: '&max-results=10'
    };

    var options = {
      host: 'www.google.com',
      path: '/m8/feeds/contacts/'+ api.google.user +'/full/' + query_params.access_token + query_params.res_type + query_params.max_results
    };

    https.get(options, function(res){

      var json = '';

      // Add the data as it comes in to the variable 'json'.
      res.on('data', function(chunk){
        json += chunk;
      });

      // Strip that shit
      res.on('end', function(){
        //Save returned contacts from Google connect to the user's contact list
        User.findOrCreate({ 'google.id' : api.google.user }, function(err, user, created) {
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

  User.findOne({ 'google.id': api.google.user }, function(err, user) {
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
    from: api.google.user,
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

