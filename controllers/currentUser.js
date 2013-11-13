var passport = require('passport');


exports.google = function (req, res) {
    console.log(req);

    if(req.user) {
        console.log('There is a user in the session: authorize.');
        return passport.authorize('google', { scope: [  'https://www.googleapis.com/auth/userinfo.profile',
                                                        'https://www.googleapis.com/auth/userinfo.email' ,
                                                        'https://mail.google.com/',
                                                        'https://www.google.com/m8/feeds'  ] ,
                                                         accessType: 'offline',  approvalPrompt: 'force' } );
    }
    else {
        console.log('No  user in session: authenticate (and create a new user)');
        return passport.authenticate('google', { scope: [  'https://www.googleapis.com/auth/userinfo.profile',
                                                        'https://www.googleapis.com/auth/userinfo.email' ,
                                                        'https://mail.google.com/',
                                                        'https://www.google.com/m8/feeds'  ] ,
                                                         accessType: 'offline',  approvalPrompt: 'force' } );
    }


};
