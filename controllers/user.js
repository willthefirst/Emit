var api = require('../app/api');
var https = require('https');
var http = require('http');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Accounts = mongoose.model('Accounts');
var api = require('../app/api');
var nodemailer = require('nodemailer');
var passport = require('passport');
var querystring = require('querystring');

/*
 * On succesful Google authorization
 */

exports.saveGoogleAccount = function(req, res, next) {

    // Fetch contact info asynchronously
    next();

    /*   Save Google contact info
  ------------------------------------------------------- */

    // Get all contacts

    var query_params = {
        access_token: '?access_token=' + api.google.access_token,
        res_type: '&alt=json',
        max_results: '&max-results=3000'
    };

    var options = {
        host: 'www.google.com',
        path: '/m8/feeds/contacts/' + req.account.google.id + '/full/' + query_params.access_token + query_params.res_type + query_params.max_results
    };

    https.get(options, function(res) {

        var json = '';

        // Add the data as it comes in to the variable 'json'.
        res.on('data', function(chunk) {
            json += chunk;
        });

        // Strip that shit
        res.on('end', function() {
            //TODO figure out how to handle an error from Google's API.
            if (res.statusCode !== 200) {
                console.log("Access Token:", query_params.access_token);
                console.log("Google responded with a", res.statusCode);
                // res.redirect('error', {error:json});
            }

            //Save returned contacts from Google connect to the user's contact list
            Accounts.findOrCreate({
                'google.id': req.account.google.id
            }, function(err, account, created) {
                account.google.contacts = api.stripGoogleContacts(json);
                account.save(function(err) {
                    if (err) return handleError(err);
                });
            });
        });

    }).on("error", function(e) {
        console.log("Failed to gather user contacts: " + e.message);
    });
};

// Facebook doesn't do refresh tokens, just long-lived access tokens.
exports.facebookConfig = function(req, res, next) {
    next();

    getFacebookToken(req);
};


exports.returnGoogleContacts = function(req, res) {
    var google_contacts;

    Accounts.findOne({
        'userId': req.session.tmpUser.username
    }, function(err, account) {
        if (err) {
            console.log('Error:', err);
            return handleError(err);
        }
        google_contacts = account.google.contacts;
        res.json(google_contacts);
    });

};

exports.returnFacebookContacts = function(req, res) {
    var fb_contacts = [];

    Accounts.findOne({
        'userId': req.session.tmpUser.username
    }, function(err, account) {
        if (err) {
            console.log('Error:', err);
            return handleError(err);
        }

        var fb_timeline_contact = {
            value: "My Facebook Timeline",
            type: 'facebook'
        }

        fb_contacts.push(fb_timeline_contact);
        res.json(fb_contacts);
    });
};

function trimForSubject( string, max_length ) {
    if (string) {
        string = string.substr(0, max_length);
        string = string.substr(0, Math.min(string.length, string.lastIndexOf(" "))) + '...';
    }
    else {
        string = '';
    }
    return string;
};

exports.sendEmail = function(req, res) {

    var gmailAccount;

    Accounts.findOne({
        'userId': req.session.tmpUser.username
    }, function(err, account) {
        if (err) {
            console.log('Error:', err);
            return handleError(err);
        }
        gmailAccount = account.google;

        var smtp_options = {
            service: "Gmail",
            auth: {
                XOAuth2: {
                    user: gmailAccount.id,
                    clientId: api.google.client_id,
                    clientSecret: api.google.client_secret,
                    refreshToken: gmailAccount.refresh_token
                }
            }
        };

        var transport = nodemailer.createTransport("SMTP", smtp_options);

        transport.sendMail({
            from: (gmailAccount.first_name + ' ' + gmailAccount.last_name + '<' + gmailAccount.id + '>'),
            to: req.body.email,
            subject: trimForSubject(req.body.body, 60),
            text: req.body.body
        }, function(error, response) {
            if (error) {
                res.json({
                    error: error
                });
            } else {
                res.json({
                    result: "Message sent"
                });
            }
        });
    });
};

exports.postToTimeline = function(req, res) {
    var request = req;
    Accounts.findOne({
        'userId': req.session.tmpUser.username
    }, function(err, account) {

        if (err) {
            console.log('Error:', err);
            return handleError(err);
        }
        var message = request.body.body;
        var token = account.facebook.long_lived_token;

        var post_data = querystring.stringify({
            access_token : token,
            message : message
        });

        var options = {
            host: 'graph.facebook.com',
            port: 443,
            path: '/me/feed',
            method: 'POST',
            headers: {
              'Content-Type'    : 'application/x-www-form-urlencoded',
              'Content-Length'  : post_data.length
            }
        };

        var req = https.request(options, function(response) {
            var data = "";

            response.setEncoding('utf8');
            response.on('data', function(d) {
                data += d;
            });
            response.on('end', function(){ // see http nodejs documentation to see end
                var json = JSON.parse(data);
                if ( json.error ) {
                    console.log("Problem posting to Facebook:", json.error.message);
                    res.json( json.error.code , {
                        'result' : json.error
                    });
                }
                else {
                    console.log('Succesful post to Facebook.');
                    res.json({
                        'result' : 'Success posting to Facebook!'
                    });
                }

                console.log("\nfinished posting message");
            });
        });

        req.on('error', function(e) {
            console.log("\nProblem with facebook post request");
            console.error(e);
        });

        req.write(post_data);
        req.end();
    });
};

function getFacebookToken(req) {
    var long_lived_token;
    var options = {
        host: 'graph.facebook.com',
        path: '/oauth/access_token?grant_type=fb_exchange_token&client_id=' + api.facebook.client_id + '&client_secret=' + api.facebook.client_secret + '&fb_exchange_token=' + api.facebook.access_token
    };

    https.get(options, function(res) {
        if (res.statusCode !== 200) {
            console.log("Error: Response from Facebook API: " + (res.statusCode));
            res.redirect('/error');
        }

        // Add the data as it comes in to the variable 'response'.
        res.on('data', function(chunk) {
            long_lived_token += chunk;
        });

        // Save long-lived token to user's profile.
        res.on('end', function() {
            long_lived_token = long_lived_token.split('access_token=');
            long_lived_token = long_lived_token[1].split('&');
            long_lived_token = long_lived_token[0];
            Accounts.findOrCreate({
                'userId': req.session.tmpUser.username
            }, function(err, account) {
                account.facebook.long_lived_token = long_lived_token;
                req.account.facebook.long_lived_token = long_lived_token;
                account.save(function(err) {
                    if (err) return handleError(err);
                    console.log('Facebook long-lived token updated');
                });
            });
        });
    });
}