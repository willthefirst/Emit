'use strict';

/* Factories */

angular.module('emit.factories', []).
factory('testFactory', function() {
	return {
		talk: function() {
			console.log('Booya!!');
		}
	}
});