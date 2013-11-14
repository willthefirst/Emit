'use strict';

// Declare app level module which depends on filters, and services

angular.module('emit', [
	'emit.controllers',
	'emit.factories',
	'emit.components',
	'ngCookies'
]).
config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
	$routeProvider.when( '/', {
		templateUrl:'partials/email',
		controller: 'AppCtrl'
	}).
    otherwise({
      redirectTo: '/'
    });

	$locationProvider.html5Mode(true);
}]);
