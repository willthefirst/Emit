'use strict';

/* Components */

angular.module('emit.components', [])
	.directive('toField', function() {
		return {
			restrict: "E",
			templateUrl: 'partials/to-field'
		};
	});