var api = require('../app/api');
var https = require('https');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var api = require('../app/api');
var hbs = require('hbs');

/*
 * On succesful Google authorization
 */
exports.saveGoogleAccount = function(req, res){
    res.redirect('/');

    /*   Save Google contact info
      ------------------------------------------------------- */

    // Get all contacts

    var query_params = {
      access_token : '?access_token=' + api.google.access_token,
      res_type : '&alt=json',
      max_results: '&max-results=2'
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
        // WHERE TO PUT THIS??
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

hbs.registerHelper('list', function(locals, options) {
  var out = "<ul>";
  console.log(locals);
  for(var i=0, l=locals.length; i<l; i++) {
    out = out + "<li>" + options.fn(locals[i]) + "</li>";
  }

  return out + "</ul>";
});

exports.show = function(req, res) {
  var google_contacts;


  User.findOne({ 'google.id': 'willthefirst@gmail.com' }, function(err, user) {
    google_contacts = user.google.contacts;
    res.locals = {
      list: ['cat', 'dog']
    };
    res.render('user');
  });


};




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


