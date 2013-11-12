/*
 * GET home page.
 */

exports.index = function(req, res){
	var id = '';

	// If we have a user, load relevant info in cookies.
	if(req.user) {
		console.log("User:",req.user.facebook);
		// Gmail
		res.cookie('g_id', req.user.google.id);

		// Facebook
		res.cookie('fb_id', req.user.facebook.id);
		res.cookie('fb_tok', req.user.facebook.long_lived_token);
	}
	else {
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
