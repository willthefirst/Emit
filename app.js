
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var auth = require('./routes/auth');
var http = require('http');
var https = require("https");
var path = require('path');
var nodemailer = require("nodemailer");
var passport = require('passport');
var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');


var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('express-jquery')('/jquery.js'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
  var mongoose_uri = 'mongodb://localhost/emit';
  mongoose.connect( mongoose_uri );

  // http://mongoosejs.com/docs/index.html

  var User;

  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function callback () {

      // Set up User schema

      var userSchema = mongoose.Schema({
         google : {
          id: String,
          contacts: Array
         }
      });

      userSchema.plugin(findOrCreate);

      User = mongoose.model('User', userSchema);

  });
}

// OAUTH INFO

var GOOGLE_CLIENT_ID = '363206404232.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET = 'Dnd6HuZBwpZnh6XNF1Pgyx2h',
    GOOGLE_ACCESS_TOKEN,
    GOOGLE_REFRESH_TOKEN,
    GOOGLE_USER;


app.get('/', routes.index);
app.get('/users', user.list);
app.get('/test', routes.test);

// Google contacts

// // Save contacts returned from Contacts API
// app.post('/google/contacts', routes.);

// // Get contacts for autocomplete
// app.get('/google/contacts', routes.gcontacts);


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    GOOGLE_ACCESS_TOKEN = accessToken;
    GOOGLE_REFRESH_TOKEN = refreshToken;
    GOOGLE_USER = profile._json.email;
    User.findOrCreate({ google : {id : GOOGLE_USER }}, function (err, user) {
      return done(err, user);
    });
  }
));

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile',
                                            'https://www.googleapis.com/auth/userinfo.email' ,
                                            'https://mail.google.com/',
                                            'https://www.google.com/m8/feeds'  ] ,
                                            accessType: 'offline', approvalPrompt: 'force' } ),
  function(req, res){
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
  });

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.

var contacts;

var json_temp = '{"version":"1.0","encoding":"UTF-8","feed":{"xmlns":"http://www.w3.org/2005/Atom","xmlns$openSearch":"http://a9.com/-/spec/opensearchrss/1.0/","xmlns$gContact":"http://schemas.google.com/contact/2008","xmlns$batch":"http://schemas.google.com/gdata/batch","xmlns$gd":"http://schemas.google.com/g/2005","id":{"$t":"willthefirst@gmail.com"},"updated":{"$t":"2013-10-30T01:13:17.010Z"},"category":[{"scheme":"http://schemas.google.com/g/2005#kind","term":"http://schemas.google.com/contact/2008#contact"}],"title":{"type":"text","$t":"Will Moritz Contacts"},"link":[{"rel":"alternate","type":"text/html","href":"http://www.google.com/"},{"rel":"http://schemas.google.com/g/2005#feed","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full"},{"rel":"http://schemas.google.com/g/2005#post","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full"},{"rel":"http://schemas.google.com/g/2005#batch","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/batch"},{"rel":"self","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full?alt\u003djson\u0026max-results\u003d10"},{"rel":"next","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full?alt\u003djson\u0026start-index\u003d11\u0026max-results\u003d10"}],"author":[{"name":{"$t":"Will Moritz"},"email":{"$t":"willthefirst@gmail.com"}}],"generator":{"version":"1.0","uri":"http://www.google.com/m8/feeds","$t":"Contacts"},"openSearch$totalResults":{"$t":"2319"},"openSearch$startIndex":{"$t":"1"},"openSearch$itemsPerPage":{"$t":"10"},"entry":[{"id":{"$t":"http://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/base/259a00892ea56d"},"updated":{"$t":"2011-10-17T21:53:20.164Z"},"category":[{"scheme":"http://schemas.google.com/g/2005#kind","term":"http://schemas.google.com/contact/2008#contact"}],"title":{"type":"text","$t":"Alan Scott"},"link":[{"rel":"http://schemas.google.com/contacts/2008/rel#edit-photo","type":"image/*","href":"https://www.google.com/m8/feeds/photos/media/willthefirst%40gmail.com/259a00892ea56d/1B2M2Y8AsgTpgAmY7PhCfg"},{"rel":"self","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/259a00892ea56d"},{"rel":"edit","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/259a00892ea56d/1318888400164001"}],"gd$email":[{"rel":"http://schemas.google.com/g/2005#other","address":"adams@vitastar-research.com","primary":"true"}]},{"id":{"$t":"http://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/base/6efa4b8fdb8a62"},"updated":{"$t":"2009-09-11T01:44:07.976Z"},"category":[{"scheme":"http://schemas.google.com/g/2005#kind","term":"http://schemas.google.com/contact/2008#contact"}],"title":{"type":"text","$t":""},"link":[{"rel":"http://schemas.google.com/contacts/2008/rel#edit-photo","type":"image/*","href":"https://www.google.com/m8/feeds/photos/media/willthefirst%40gmail.com/6efa4b8fdb8a62/1B2M2Y8AsgTpgAmY7PhCfg"},{"rel":"self","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/6efa4b8fdb8a62"},{"rel":"edit","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/6efa4b8fdb8a62/1252633447976000"}],"gd$email":[{"rel":"http://schemas.google.com/g/2005#other","address":"julius.mitchell@yale.edu","primary":"true"}]},{"id":{"$t":"http://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/base/70c2c48d7f246b"},"updated":{"$t":"2012-03-20T17:07:22.801Z"},"category":[{"scheme":"http://schemas.google.com/g/2005#kind","term":"http://schemas.google.com/contact/2008#contact"}],"title":{"type":"text","$t":""},"link":[{"rel":"http://schemas.google.com/contacts/2008/rel#edit-photo","type":"image/*","href":"https://www.google.com/m8/feeds/photos/media/willthefirst%40gmail.com/70c2c48d7f246b/1B2M2Y8AsgTpgAmY7PhCfg"},{"rel":"self","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/70c2c48d7f246b"},{"rel":"edit","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/70c2c48d7f246b/1332263242801001"}],"gd$email":[{"rel":"http://schemas.google.com/g/2005#other","address":"brian.william@viget.com","primary":"true"}]},{"id":{"$t":"http://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/base/742a848e92ab7f"},"updated":{"$t":"2013-10-27T10:42:58.986Z"},"category":[{"scheme":"http://schemas.google.com/g/2005#kind","term":"http://schemas.google.com/contact/2008#contact"}],"title":{"type":"text","$t":"Kyle Miller"},"link":[{"rel":"http://schemas.google.com/contacts/2008/rel#edit-photo","type":"image/*","href":"https://www.google.com/m8/feeds/photos/media/willthefirst%40gmail.com/742a848e92ab7f/uDtQYiUly1a7QZuJqCCMYQ"},{"rel":"http://schemas.google.com/contacts/2008/rel#photo","type":"image/*","href":"https://www.google.com/m8/feeds/photos/media/willthefirst%40gmail.com/742a848e92ab7f"},{"rel":"self","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/742a848e92ab7f"},{"rel":"edit","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/742a848e92ab7f/1382870578986000"}],"gd$email":[{"rel":"http://schemas.google.com/g/2005#other","address":"kyle.miller.250@gmail.com","primary":"true"},{"rel":"http://schemas.google.com/g/2005#other","address":"kyle.miller@yale.edu"},{"rel":"http://schemas.google.com/g/2005#other","address":"polyman586@yahoo.com"},{"rel":"http://schemas.google.com/g/2005#other","address":"kylemiller250@gmail.com"}],"gd$phoneNumber":[{"rel":"http://schemas.google.com/g/2005#mobile","uri":"tel:+1-626-644-2854","$t":"+16266442854"}],"gd$extendedProperty":[{"xmlns":"","name":"GCon","$t":"\u003ccc\u003e0\u003c/cc\u003e"}],"gContact$groupMembershipInfo":[{"deleted":"false","href":"http://www.google.com/m8/feeds/groups/willthefirst%40gmail.com/base/241747b60aabbd0f"},{"deleted":"false","href":"http://www.google.com/m8/feeds/groups/willthefirst%40gmail.com/base/43bb4340ad42cdc"}]},{"id":{"$t":"http://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/base/81dbfb8bb4acac"},"updated":{"$t":"2012-02-11T22:00:19.875Z"},"category":[{"scheme":"http://schemas.google.com/g/2005#kind","term":"http://schemas.google.com/contact/2008#contact"}],"title":{"type":"text","$t":"Laurence Hills"},"link":[{"rel":"http://schemas.google.com/contacts/2008/rel#edit-photo","type":"image/*","href":"https://www.google.com/m8/feeds/photos/media/willthefirst%40gmail.com/81dbfb8bb4acac/1B2M2Y8AsgTpgAmY7PhCfg"},{"rel":"self","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/81dbfb8bb4acac"},{"rel":"edit","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/81dbfb8bb4acac/1328997619875001"}],"gd$email":[{"rel":"http://schemas.google.com/g/2005#other","address":"laurenceh@frenchamericansf.org"}]},{"id":{"$t":"http://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/base/9553328aa0fb9e"},"updated":{"$t":"2010-01-27T21:27:24.895Z"},"category":[{"scheme":"http://schemas.google.com/g/2005#kind","term":"http://schemas.google.com/contact/2008#contact"}],"title":{"type":"text","$t":"service@paypal.com"},"link":[{"rel":"http://schemas.google.com/contacts/2008/rel#edit-photo","type":"image/*","href":"https://www.google.com/m8/feeds/photos/media/willthefirst%40gmail.com/9553328aa0fb9e/1B2M2Y8AsgTpgAmY7PhCfg"},{"rel":"self","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/9553328aa0fb9e"},{"rel":"edit","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/9553328aa0fb9e/1264627644895000"}],"gd$email":[{"rel":"http://schemas.google.com/g/2005#other","address":"service@pavpal.com","primary":"true"}]},{"id":{"$t":"http://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/base/9d31420c6b2506"},"updated":{"$t":"2010-12-09T22:11:25.579Z"},"category":[{"scheme":"http://schemas.google.com/g/2005#kind","term":"http://schemas.google.com/contact/2008#contact"}],"title":{"type":"text","$t":"Verification Verification"},"link":[{"rel":"http://schemas.google.com/contacts/2008/rel#edit-photo","type":"image/*","href":"https://www.google.com/m8/feeds/photos/media/willthefirst%40gmail.com/9d31420c6b2506/1B2M2Y8AsgTpgAmY7PhCfg"},{"rel":"self","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/9d31420c6b2506"},{"rel":"edit","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/9d31420c6b2506/1291932685579000"}],"gd$email":[{"rel":"http://schemas.google.com/g/2005#other","address":"verification@essayexchange.org","primary":"true"}]},{"id":{"$t":"http://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/base/a1e3bd8b939394"},"updated":{"$t":"2013-04-07T16:13:44.053Z"},"category":[{"scheme":"http://schemas.google.com/g/2005#kind","term":"http://schemas.google.com/contact/2008#contact"}],"title":{"type":"text","$t":""},"link":[{"rel":"http://schemas.google.com/contacts/2008/rel#edit-photo","type":"image/*","href":"https://www.google.com/m8/feeds/photos/media/willthefirst%40gmail.com/a1e3bd8b939394/1B2M2Y8AsgTpgAmY7PhCfg"},{"rel":"self","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/a1e3bd8b939394"},{"rel":"edit","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/a1e3bd8b939394/1365351224053001"}],"gd$email":[{"rel":"http://schemas.google.com/g/2005#other","address":"kkmwc-3728416605@comm.craigslist.org","primary":"true"}]},{"id":{"$t":"http://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/base/addedf8ec91f86"},"updated":{"$t":"2012-02-11T22:00:19.875Z"},"category":[{"scheme":"http://schemas.google.com/g/2005#kind","term":"http://schemas.google.com/contact/2008#contact"}],"title":{"type":"text","$t":"Marissa Goldman"},"link":[{"rel":"http://schemas.google.com/contacts/2008/rel#edit-photo","type":"image/*","href":"https://www.google.com/m8/feeds/photos/media/willthefirst%40gmail.com/addedf8ec91f86/1B2M2Y8AsgTpgAmY7PhCfg"},{"rel":"self","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/addedf8ec91f86"},{"rel":"edit","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/addedf8ec91f86/1328997619875001"}],"gd$email":[{"rel":"http://schemas.google.com/g/2005#other","address":"ncutiewitabooty@aol.com"}]},{"id":{"$t":"http://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/base/cd35850adb3645"},"updated":{"$t":"2012-10-05T00:44:23.315Z"},"category":[{"scheme":"http://schemas.google.com/g/2005#kind","term":"http://schemas.google.com/contact/2008#contact"}],"title":{"type":"text","$t":""},"link":[{"rel":"http://schemas.google.com/contacts/2008/rel#edit-photo","type":"image/*","href":"https://www.google.com/m8/feeds/photos/media/willthefirst%40gmail.com/cd35850adb3645/1B2M2Y8AsgTpgAmY7PhCfg"},{"rel":"self","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/cd35850adb3645"},{"rel":"edit","type":"application/atom+xml","href":"https://www.google.com/m8/feeds/contacts/willthefirst%40gmail.com/full/cd35850adb3645/1349397863315000"}],"gd$email":[{"rel":"http://schemas.google.com/g/2005#other","address":"ttfqw-3316519893@comm.craigslist.org","primary":"true"}]}]}} ';
contacts = JSON.parse(json_temp);
contacts_list = contacts.feed.entry;
console.log(typeof(contacts_list));

function contact( user_name, user_email ) {
  this.name = user_name;
  this.email = user_email;
}

var contacts_arr = [];

// For every contact in the returned list
for (var key in contacts_list) {

   var obj = contacts_list[key];
   var current_contact = new contact();

   // Loop through single contacts properties
   for (var prop in obj) {

      // important check that this is objects own property
      // not from prototype prop inherited
      if(obj.hasOwnProperty(prop)){
        if (prop === 'title') {
          current_contact.name = obj[prop]['$t'];
        }
        else if (prop === 'gd$email') {
          current_contact.email = obj[prop]['0']['address'];
        }
      }
   }
  contacts_arr.push(current_contact);
}

console.log(contacts_arr);
// console.log('Contacts:', contacts.feed.entry);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/test' }),
  function(req, res) {
    res.redirect('/');

    var query_params = {
      access_token : '?access_token=' + GOOGLE_ACCESS_TOKEN,
      res_type : '&alt=json',
      max_results: '&max-results=100'
    };

    // Get all contacts
    var options = {
      host: 'www.google.com',
      path: '/m8/feeds/contacts/'+ GOOGLE_USER +'/full/' + query_params.access_token + query_params.res_type + query_params.max_results
    };

    https.get(options, function(res){
      res.on('data', function(json){
        contacts = JSON.parse(json_temp);
        console.log('Contacts:', contacts.feed.entry[2]);
      });
    }).on("error", function(e){
      console.log("Failed to gather user contacts: " + e.message);
    });

    // Spit out all of there contacts

    // console.log(
    //   'user:', GOOGLE_USER,
    //   'clientId:', GOOGLE_CLIENT_ID,
    //   'clientSecret:', GOOGLE_CLIENT_SECRET,
    //   'refreshToken:', GOOGLE_REFRESH_TOKEN,
    //   'accessToken:', GOOGLE_ACCESS_TOKEN,
    //   'timeout:', 3600
    // );

    var smtp_options = {
        service: "Gmail",
        auth: {
            XOAuth2: {
                user: GOOGLE_USER,
                clientId: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                refreshToken: GOOGLE_REFRESH_TOKEN,
                accessToken: GOOGLE_ACCESS_TOKEN,
            }
        }
    };

    var transport = nodemailer.createTransport("SMTP", smtp_options);

    // transport.sendMail({
    //   from: "me@tr.ee",
    //   to: "cbisnar@gmail.com",
    //   subject: "Hello world!",
    //   text: "Plaintext body"
    // }, function(error, response){
    //   if(error){
    //       console.log(error);
    //   }else{
    //       console.log("Message sent: " + response.message);
    //   }
    // });
});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});