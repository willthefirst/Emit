var mongoose = require('mongoose');
var User = mongoose.model('User');
var Accounts = mongoose.model('Accounts');

/*
 * GET home page.
 */

exports.index = function(req, res){

    // // Force login for development
    //     req.session.tmpUser = {
    //         username: 'willthefirst@gmail.com',

    //         googleConnected: true,
    //         facebookConnected: true
    //     }

    //     Accounts.findOne({ userId : 'willthefirst@gmail.com'}, function(err, account) {

    //         if (err) {
    //             console.log('Error:', err);
    //             return handleError(err);
    //         }
    //         console.log('Logged in:', account);
    //         // Google
    //         res.cookie('g_id', (account.google.id));

    //         // Facebook
    //         res.cookie('fb_id', account.facebook.id);
    //         res.cookie('fb_tok', account.facebook.long_lived_token);

    //         res.render('index');

    //     });

    // Production real logins

    // If there's a tmpUser
    if(req.session.tmpUser) {

        Accounts.findOne({ userId : req.session.tmpUser.username}, function(err, account) {
            if (err) {
                console.log('Error:', err);
                return handleError(err);
            }
            console.log('Logged in');
            // Google
            res.cookie('g_id', (account.google.id));

            // Facebook
            res.cookie('fb_id', account.facebook.id);

            res.render('index', {
                fbStatus: 'fb-connected',
                gStatus: 'g-connected'
            });

        });

    }

    // Else: no tmpUser
    else {
        console.log('No User');
        console.log(req.session);

        res.clearCookie('g_id');
        res.clearCookie('fb_id');

        res.render('index', {
            fbStatus: '',
            gStatus: ''
        });
    }

};

exports.partials = function(req, res) {
    var name = req.params.name;


    if(req.session.tmpUser) {

        var fb_connected, g_connected;
        console.log('Tmp user:',  req.session.tmpUser);
        if( req.session.tmpUser.googleConnected ) {
            console.log('Yes Google');
            g_connected = 'g-connected';
        }
        if( req.session.tmpUser.facebookConnected ) {
            console.log('Yes Facebook');
            fb_connected = 'fb-connected';
        }

        Accounts.findOne({ userId : req.session.tmpUser.username}, function(err, account) {
            if (err) {
                console.log('Error:', err);
                return handleError(err);
            }

            res.render('partials/' + name, {
                fbStatus: fb_connected,
                gStatus: g_connected
            });

        });

    }

    // Else: no tmpUser
    else {
        console.log('No Tmp User');

        res.clearCookie('g_id');
        res.clearCookie('fb_id');

        res.render('partials/' + name, {
            fbStatus: '',
            gStatus: ''
        });
    }
};
