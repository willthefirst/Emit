/*
 * GET contacts
 */

exports.saveContacts = function(req, res){
	res.render('gcontacts', { contacts: 'contacts' });
};

exports.getContacts = function(req, res){
  res.render('gcontacts', { contacts: 'contacts' });
};