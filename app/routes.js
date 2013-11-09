var routes = require('../controllers/index');
var user = require('../controllers/user');
var passport = require('passport');
var auth = require('./helpers');

exports.initialize = function(app){
	app.get('/', routes.index);
	app.get('/partials/:name', routes.partials);

	app.get('/logout', user.logout);
	app.get('/user/google/auth', passport.authenticate('google', { scope: [  'https://www.googleapis.com/auth/userinfo.profile',
                                                'https://www.googleapis.com/auth/userinfo.email' ,
                                                'https://mail.google.com/',
                                                'https://www.google.com/m8/feeds'  ] ,
                                                accessType: 'offline', approvalPrompt: 'force' } ));
	app.get('/user/google/auth/callback', passport.authenticate('google'), user.saveGoogleAccount);
	app.get('/user/google/contacts', user.show);
	app.post('/user/google/send', user.sendEmail);
	// redirect all others to the index (HTML5 history)
	app.get('/*', routes.index);
};
