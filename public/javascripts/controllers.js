'use strict';

/* Controllers */

angular.module('emit.controllers', []).
  controller('AppCtrl', function ($scope, $http) {

    $http({
      method: 'GET',
      url: '/user/gcontacts'
    }).
    success(function (data, status, headers, config) {

      // Set up autocomplete for email form
      $("#contacts").autocomplete({
        source: function(req, res) {
          // Search name and email for a match with input, and show in a custom format
          // in autocomplete.
            var array = [];
            for(var i=0; i < data.length; i++){
              array.push(data[i].name + ' ' + data[i].email);
            }
            var resultsArray = [];
            var re = $.ui.autocomplete.escapeRegex(req.term);
            var matcher = new RegExp( "\\b" + re, "i" );
            var a = $.grep( array, function(item,index){
                if (matcher.test(item)){
                  resultsArray.push(data[(array.indexOf(item))]);
                  return true;
                }
            });
            res( resultsArray );
        },
        matchContains: true,
        delay: 0
      }).data( "ui-autocomplete" )._renderItem = function( ul, item ) {
      return $( "<li>" )
        .append( '<span class="google-contact-name">'+ item.name + '</span><br /><span class="google-contact-email">' + item.email + "</span>" )
        .appendTo( ul );
      };

      $scope.contacts = data;
    }).
    error(function (data, status, headers, config) {
      $scope.contacts = 'No GContact data!';
    });

  });
