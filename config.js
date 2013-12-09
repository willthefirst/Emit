var development = {
	address : 'localhost:3000'
}

var production = {
	address : 'emit.herokuapp.com'
}

exports.Config = global.process.env.NODE_ENV === 'production' ? production : development;
