
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Emit' });
};


/*
 * GET test page.
 */

exports.test = function(req, res){
  res.render('test');
};

