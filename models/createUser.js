var userSchema = mongoose.Schema({
   openId: String,
   facebookId: String
});

userSchema.plugin(findOrCreate);

module.exports = mongoose.model('User', userSchema);