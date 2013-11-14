var routes = require('../controllers/index');
var user = require('../controllers/user');
var passport = require('passport');
var auth = require('./helpers');

exports.initialize = function(app){

	// Give all routing to Angular except for API calls
	app.get('/', routes.index);
	app.get('/partials/:name', routes.partials);

	// User
	app.post('/login',
	  passport.authenticate('local', { successRedirect: '/',
	                                   failureRedirect: '/login'
	                               })
	);

	app.get('/logout', user.logout);

	// Google
	app.get('/user/google/auth', passport.authorize('google', { scope: [  'https://www.googleapis.com/auth/userinfo.profile',
                                                'https://www.googleapis.com/auth/userinfo.email' ,
                                                'https://mail.google.com/',
                                                'https://www.google.com/m8/feeds'  ] ,
                                                 accessType: 'offline',  approvalPrompt: 'force' } ));
	app.get('/user/google/auth/callback', passport.authorize('google'), user.saveGoogleAccount);
	app.get('/user/google/contacts', user.show);
	app.post('/user/google/send', user.sendEmail);

	// Facebook
	app.get('/user/facebook/auth', passport.authenticate('facebook', { scope: ['publish_actions','read_friendlists' ] }));
	app.get('/user/facebook/auth/callback', passport.authenticate('facebook'), user.facebookConfig	);


	// Redirect all others to the index (HTML5 history)
	app.get('/*', routes.index);
};
