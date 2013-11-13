/*
 * GET home page.
 */

exports.index = function(req, res){
	var id = '';

	console.log('account: '+req.account);
	// If we have a user, load relevant info in cookies.
	if(req.user) {
		console.log("User's FB:", req.user.facebook);
		console.log("User's G:", req.user.google);

		// Google
		res.cookie('g_id', req.user.google.id);

		// Facebook
		res.cookie('fb_id', req.user.facebook.id);
		res.cookie('fb_tok', req.user.facebook.long_lived_token);
	}
	else {
		console.log('No User');
		res.clearCookie('g_id');
		res.clearCookie('fb_id');
		res.clearCookie('fb_tok');
	}

	res.render('index');

};

exports.partials = function(req, res) {
	var name = req.params.name;
	res.render('partials/' + name);
};
