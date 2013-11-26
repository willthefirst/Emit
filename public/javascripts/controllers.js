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
    jQuery(document).ready(function($) {

        var gmailUser = $cookies.g_id;
        var facebookUser = $cookies.fb_id;
        $scope.addresses = [];
        console.log($scope.addresses);

        var all_contacts = [];

        // If Google user, get contacts.
        if (!gmailUser) {
            console.log('No Gmail user.');
        }
        else {
            retrieveContacts.google( function(data, status, headers, config ) {
                all_contacts = all_contacts.concat(data);
                console.log('appended gmail contacts: length=', all_contacts.length);
                initializeAutocomplete(all_contacts);
            });
        }

        // If Facebook user, get friends + timeline contacts.
        if (!facebookUser) {
            console.log('No Facebook user.');
        }
        else {
            retrieveContacts.facebook( function(data, status, headers, config ) {
                all_contacts = all_contacts.concat(data);
                console.log('appended fb contacts: length=', all_contacts.length);
                initializeAutocomplete(all_contacts);
            });
        }

        //TODO: initialize autocomplete with all data returned.
        function initializeAutocomplete(data) {
            console.log('initialized');

            // If non-autocomplete address is entered
            $('#contacts').off('keypress');
            $('#contacts').on('keypress', function(e){
                var $this = $(this);
                // If comma or enter is pressed
                if (e.charCode === 13 || e.charCode === 44) {
                    $scope.$apply(function(){
                        $scope.addresses.push($this.val());
                    });
                    $this.val('');
                    return false;
                };
            });

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
                    // in autocomplete.

                    var term = req.term;

                    var array = [];

                    var max = 10; // maximum results to display
                    var j = 0;

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
                focus: function(event, ui) {
                    return false;
                },
                select: function(event, ui) {
                    var $this = $(this);
                    $scope.$apply(function(){

                        $scope.addresses.push({
                            address: ui.item.value,
                            type: ui.item.type
                        });
                        $this.val('');

                    });
                    return false;
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

        // Remove an approved-address
        $scope.delete = function ( idx ) {
            var address_to_delete = $scope.addresses[idx];
            $scope.addresses.splice(idx, 1);
        };

        // Submit stuff

        $scope.send = function() {
            var address;
            var all_emails;
            for (var i = 0; i < $scope.addresses.length; i++) {
                address = $scope.addresses[i].address;
                if (address.type === 'facebook') {
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
                    all.emails.push(address);
                    // TODO build validation for this to make sure we're not sending stupid addresses.
                }
            }

            // After we've collected all valid emails, send to them in a batch instead of one by one.
            if(all_emails) {
                $http({
                    method: 'POST',
                    url: '/user/google/send',
                    data: {
                        email: all_emails,
                        body: $scope.text
                    }
                }).success(function(data, status, headers, config) {
                    if (data.error) {
                        $scope.result('Problem sending email', data.error);
                    }
                    else {
                        $scope.result = (data.result);
                    }
                }).
                error(function(data, status, headers, config) {
                    console.log('Problem posting Emit server.');
                    $scope.result = (status, data.result);
                });
            }
        };
    });

});