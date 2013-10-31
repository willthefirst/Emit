var helpers = require('../app/helpers');
var https = require('../app/helpers');

/*
 * On succesful Google authorization
 */
exports.googleResult = function(req, res){
    res.redirect('/');
    helpers.saveContacts();
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


