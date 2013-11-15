var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');

var accountsSchema = mongoose.Schema({

	userId: String,

	google : {
		id: String,
		first_name: String,
		last_name: String,
		contacts: Array,
		refresh_token: String
	},

	facebook: {
		id: String,
		first_name: String,
		last_name: String,
		long_lived_token: String,
		access_token: String
	}

});

// add the findOrCreate plugin to our the schema
accountsSchema.plugin(findOrCreate);

var Accounts = mongoose.model('Accounts', accountsSchema);
module.exports = mongoose.model('Accounts', accountsSchema);