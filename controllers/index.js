/*
 * GET home page.
 */

exports.index = function(req, res){
	var id = '';
	console.log(req.user);

	// If we have a user, load relevant info in cookies.
	if(req.user) {
		// Gmail
		res.cookie('g_id', req.user.google.id);

		// Facebook
		res.cookie('fb_tok', req.user.facebook.long_lived_token);
		res.cookie('fb_id', req.user.facebook.id);

	}

	res.render('index');

};

exports.partials = function(req, res) {
	var name = req.params.name;
	res.render('partials/' + name);
};
