exports.initalize(function(app){
	app.get('/', routes.index);
	app.get('/users', user.list);
	app.get('/test', routes.test);

});