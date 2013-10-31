var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');

var userSchema = mongoose.Schema({
   google : {
    id: String,
    contacts: Array
   }
});

// add the findOrCreate plugin to our the schema
userSchema.plugin(findOrCreate);

var User = mongoose.model('User', userSchema);

module.exports = mongoose.model('User', userSchema);