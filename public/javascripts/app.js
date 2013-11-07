'use strict';

// Declare app level module which depends on filters, and services

angular.module('emit', [
  'emit.controllers',
  'ngCookies'
]).
config(function ($routeProvider, $locationProvider) {
	$routeProvider.when( '/hello', {
		templateURL:'partials/email.html',
		controller:'AppCtrl'
	});
	$locationProvider.html5Mode(true);
});
