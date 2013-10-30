var userSchema = mongoose.Schema({
   google : {
   	id: String,
   	contacts: Array
   }
});

userSchema.plugin(findOrCreate);

module.exports = mongoose.model('User', userSchema);