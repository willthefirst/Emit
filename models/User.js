var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');

var userSchema = mongoose.Schema({

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
		long_lived_token: String
	}

});

// add the findOrCreate plugin to our the schema
userSchema.plugin(findOrCreate);

var User = mongoose.model('User', userSchema);

module.exports = mongoose.model('User', userSchema);