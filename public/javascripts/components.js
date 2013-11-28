'use strict';

/* Directives */

angular.module('emit.components', []).
	directive('addressStatus', function(){
		return {
			restrict: 'E',
			link: function(scope, element, attrs) {
				scope.$watch( function(){return scope.address.status }, function(newVal, oldVal) {
					switch (scope.address.status) {
						case 'removeable':
							element.html('removeable');
							break;
						case 'sending':
							element.html('sending');
							break;
						case 'success':
							element.html('success');
							break;
						case 'error':
							element.html('error');
							break;
					}
				});
			}
		};
	});
