exports.restrict = function (req, res, next) {
  if (req.session.user) {
  	console.log('logged in');
    next();
  } else {
  	console.log('access denied');
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
};