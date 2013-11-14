'use strict';

/* Controllers */

angular.module('emit.controllers', ['emit.factories']).
controller('AppCtrl', function($scope, $http, $cookies) {

    /* Modules that we need

            CURRENTLY WORKING ON --

            I) Autocomplete Feeder

            + Depending on what cookies are populated, makes requests to server to pull in relevant contacts.
            + If helpful, marks up contacts with data to help the Submit manager decide what to do.
            + Works asynchronously (and behaves well when user asks for something that hasn't yet arrived.)

            Google user:
            - if required google cookies exist
                    - request contacts from server
                    - add to the autocomplete form.

            Facebook user:
            - if required facebook cookies exist
                - add 'Facebook Timeline' to autocomplete
                - request facebook friends from server
                    - on succesful response: add to autocomplete

        TODO --

        II) Submit manager

            On submit:

            + Handles different kinds of addresses being submitted to at the same time:
                - Gmail email + Facebook messages
                - Gmail email + Facebook timeline
            + Works asynchronously (and behaves well when user asks for something that hasn't yet arrived.)

        III) Autocomplete

            + Tabbing works

        IV) Message beautifier

            + Adds Facebook-like previews, and link shortening if Facebook user is connected/submitting a facebook post


    */

}).controller('AutocompleteManager', function($scope, $http, $cookieStore, $cookies, retrieveContacts) {

    retrieveContacts.talk();

    var gmailUser = $cookies.g_id;

    // If not logged in, don't fetch Gmail contacts
    if (!gmailUser) {
        console.log('No Gmail user.');
    }
    // Otherwise, retrieve Gmail contacts
    else {
        retrieveContacts.google();
    }

}).controller('Submit', function($scope, $http, $cookieStore) {
    $scope.result = '';
    var fb_tok = $cookieStore.get(fb_tok);
    var fb_id = $cookieStore.get(fb_id);


    $scope.sendGmail = function() {
        if ($scope.email === "Facebook") {
            $http({
                method: 'POST',
                url: 'https://graph.facebook.com/' + fb_id + '/feed',
                params: {
                    access_token: fb_tok,
                    message: 'Testing testing'
                }
            }).success(function(data, status, headers, config) {
                console.log('Success posting to facebook:', status, data);
                $scope.result = (status, data.result);
            }).
            error(function(data, status, headers, config) {
                console.log('Error posting to facebook:', status, data.error.message);
                $scope.result = (status, data.result);
            });
        } else {
            $http({
                method: 'POST',
                url: '/user/google/send',
                data: {
                    email: $scope.email,
                    body: $scope.text
                }
            }).success(function(data, status, headers, config) {
                $scope.result = (status, data.result);
            }).
            error(function(data, status, headers, config) {
                $scope.result = (status, data.result);
            });
        }

    };
});