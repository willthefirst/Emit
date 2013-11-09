'use strict';

// Declare app level module which depends on filters, and services

angular.module('emit', []).
config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
	$routeProvider.when( '/', {
		templateUrl:'partials/test',
		controller: AppCtrl
	}).
    otherwise({
      redirectTo: '/'
    });

	$locationProvider.html5Mode(true);
}]);
