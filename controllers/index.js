/*
 * GET home page.
 */

exports.index = function(req, res){
	var id = '';

	if(req.user) {
		id = req.user.google.id;
	}

	res.cookie('user', JSON.stringify({
		'id': id
	}));
	res.render('index');

};

exports.partials = function(req, res) {
	var name = req.params.name;
	console.log('asdfghjkl;');
	res.render('partials/' + name);
};
