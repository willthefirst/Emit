var index = require('./controllers/index');
var user = require('./controllers/user');
var passport = require('passport');


exports.initialize = function(app){
	app.get('/', index.index);
	app.get('/user/auth/google', user.authenticate);
};