'use strict';

/* Directives */

angular.module('emit.directives', []).
    directive('address-status', function(){
        return {
            restrict: 'E',
                link: function(scope, element, attrs) {
                    element.html('testing the element');
                    console.log('element');
            }
        };
    });
