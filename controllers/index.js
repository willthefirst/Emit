var mongoose = require('mongoose');
var User = mongoose.model('User');
var Accounts = mongoose.model('Accounts');

/*
 * GET home page.
 */

exports.index = function(req, res){

    // If there's a tmpUser
    if(req.session.tmpUser) {

        Accounts.findOne({ userId : req.session.tmpUser.username}, function(err, account) {
            if (err) {
                console.log('Error:', err);
                return handleError(err);
            }
            console.log('Logged in:', account);
            // Google
            res.cookie('g_id', (account.google.id).toString());

            // Facebook
            res.cookie('fb_id', account.facebook.id);
            res.cookie('fb_tok', account.facebook.long_lived_token);

            res.render('index');

        });

    }

    // Else: no tmpUser
    else {
        console.log('No User');
        console.log(req.session);

        res.clearCookie('g_id');
        res.clearCookie('fb_id');
        res.clearCookie('fb_tok');

        res.render('index');

    }


};

exports.partials = function(req, res) {
    var name = req.params.name;
    res.render('partials/' + name);
};
