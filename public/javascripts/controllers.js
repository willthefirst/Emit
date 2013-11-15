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

            - Create a general model for any result of ajax requests
                - when ou

            Google user:
            - if required google cookies exist
                - request contacts from server
                    - populate Contacts model with results.
                - Angularify the form so that it updates automatically.

            Facebook user:
            - if required facebook cookies exist
                - add 'Facebook Timeline' to autocomplete
                - request facebook friends from server
                    - on succesful response: add to autocomplete

        TODO --

        II) Submit manager

            On submit:

            + Handles different kinds of addresses being submitted to at the same time:
                - Gmail email + Facebook timeline
            + Works asynchronously (and behaves well when user asks for something that hasn't yet arrived.)

        III) Autocomplete

            + Tabbing works
            - Com
            - On select, add the Contact to a 'Selected' model,

        IV) Message beautifier

            + Adds Facebook-like previews, and link shortening if Facebook user is connected/submitting a facebook post


    */

}).controller('AutocompleteManager', function($scope, $http, $cookieStore, $cookies, retrieveContacts) {

    var gmailUser = $cookies.g_id;
    var facebookUser = $cookies.fb_id;

    var all_contacts = {};


    // If Google user, get contacts.
    if (!gmailUser) {
        console.log('No Gmail user.');
    }
    else {
        retrieveContacts.google( function(data, status, headers, config ) {
            for (var i in data) { all_contacts[i] = data[i]; }
            console.log('appended gmail contacts: ');
            initializeAutocomplete(all_contacts);

        });
    }

    // If Facebook user, get friends + timeline contacts.
    if (!facebookUser) {
        console.log('No Facebook user.');
    }
    else {
        retrieveContacts.facebook( function(data, status, headers, config ) {
            for (var i in data) { all_contacts[i] = data[i]; }
            console.log('appended fb contacts');
            initializeAutocomplete(all_contacts);
        });
    }

    //TODO: initialize autocomplete with all data returned.

    function initializeAutocomplete(data) {
        console.log('initialized');

        // Strip out contacts without emails from contacts
        var split = function(val) {
            return val.split(/,\s*/);
        }

        var extractLast = function(term) {
            return split(term).pop();
        }

        // Set up autocomplete for email form
        $("#contacts").autocomplete({
            source: function(req, res) {
                // Search name and email for a match with input, and show in a custom format
                // in autocomplete. Configured for multiple addresses.

                var term = req.term;

                if (term.indexOf(', ') > 0) {
                    var index = term.lastIndexOf(', ');
                    term = term.substring(index + 2);
                }

                var array = [];

                var max = 10; // maximum results to display
                var j = 0;

                console.log(data.length);
                for (var i = 0; i < data.length; i++) {
                    array.push(data[i].label + ' ' + data[i].value);
                }
                var resultsArray = [];
                var re = $.ui.autocomplete.escapeRegex(term);
                var matcher = new RegExp("\\b" + re, "i");
                var a = $.grep(array, function(item, index) {
                    if (matcher.test(item) && j < max) {
                        resultsArray.push(data[(array.indexOf(item))]);
                        j++;
                        return true;
                    }
                });
                res($.ui.autocomplete.filter(resultsArray,
                    extractLast(term)));
            },
            select: function(event, ui) {
                var terms = split(this.value);
                // remove the current input
                terms.pop();
                // add the selected item
                terms.push(ui.item.value);
                // add placeholder to get the comma-and-space at the end
                terms.push("");
                this.value = terms.join(", ");
                console.log(this.value);
                return false;

                // $("#contacts").val(ui.item.value);
                // return false;
            },
            open: function() {
                $('.ui-menu').width(650);
            },
            delay: 0
        }).data("ui-autocomplete")._renderItem = function(ul, item) {

            // Just display emails if there is no corresponsding first name.
            if (item.label === "") {
                return $("<li>")
                    .append('<a><span class="google-contact-email-only">' + item.value + "</span></a>")
                    .appendTo(ul);
            } else {
                return $("<li>")
                    .append('<a><span class="google-contact-name">' + item.label + '</span><span class="google-contact-email">' + item.value + "</span></a>")
                    .appendTo(ul);
            }
        };

    };




    // Submit stuff

    $scope.result = '';

    $scope.send = function() {
        console.log($scope.email);
        if ($scope.email === "Facebook") {
            console.log('Posting to facebook.');
            $http({
                method: 'POST',
                url: '/user/facebook/postToTimeline',
                data: {
                    body: $scope.text
                }
            }).success(function(data, status, headers, config) {
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
                console.log('Problem posting to Facebook (serversive problem though)');
                $scope.result = (status, data.result);
            });
        }

    };

});