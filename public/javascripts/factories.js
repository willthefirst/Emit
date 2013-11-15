'use strict';

/* Factories */

angular.module('emit.factories', []).
factory('retrieveContacts', function( $http ) {

	function getGoogleContacts( callback ) {
		// Get Google contacts
		console.log('Gmail user: retrieving contacts...');

		$http({
			method: 'GET',
			url: '/user/google/contacts'
		}).
		success(function(data, status, headers, config) {
			console.log('Google contacts retrieved.');
			callback(data, status, headers, config);
		}).
		error(function(data, status, headers, config) {
			console.log('No GCONTACT DATA!');
		});
	};

	function getFacebookContacts( callback ) {
		// Get Google contacts
		console.log('Facebook user: retrieving friends...');

		$http({
			method: 'GET',
			url: '/user/facebook/contacts'
		}).
		success(function(data, status, headers, config) {
			console.log('Facebook contacts retrieved.');
			callback(data, status, headers, config);
		}).
		error(function(data, status, headers, config) {
			console.log('No FACEBOOK DATA!');
		});
	}


	// Get Facebook contacts

	return {
		google: getGoogleContacts,
		facebook: getFacebookContacts,
	}
});