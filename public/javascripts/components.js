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
							break;
						case 'sending':
							element.html('<a class="waiting approved-contacts__remove">⨯</a>');
							break;
						case 'success':
							element.html('✓');
							break;
						case 'error':
							element.html('<a class="to-error">!<div class="to-error__message">' + scope.address.error + '</div></a>');
							break;
					}
				});
			}
		};
	});
