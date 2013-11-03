var index = require('../controllers/index');
var user = require('../controllers/user');
var passport = require('passport');
var auth = require('./helpers');

exports.initialize = function(app){
	app.get('/', index.index);
	app.get('/user/auth/google', passport.authenticate('google', { scope: [  'https://www.googleapis.com/auth/userinfo.profile',
                                                'https://www.googleapis.com/auth/userinfo.email' ,
                                                'https://mail.google.com/',
                                                'https://www.google.com/m8/feeds'  ] ,
                                                accessType: 'offline', approvalPrompt: 'force' } ));
	app.get('/user/auth/google/callback',  passport.authenticate('google', { failureRedirect: '/FAILLED' }), user.saveGoogleAccount);
	app.get('/user/gcontacts', user.show);
	app.post('/user/gsend', user.sendEmail);

};
