var userSchema = mongoose.Schema({
   gmailId: String,
   facebookId: String
});

userSchema.plugin(findOrCreate);

module.exports = mongoose.model('User', userSchema);