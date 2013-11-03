'use strict';

/* Controllers */

angular.module('emit.controllers', []).
  controller('AppCtrl', function ($scope, $http) {

    $http({
      method: 'GET',
      url: '/user/gcontacts'
    }).
    success(function (data, status, headers, config) {
      console.log(data);
      var array = [];
      for(var i=0; i < data.length; i++){
        // http://stackoverflow.com/questions/16309940/jquery-autocomplete-vs-gmail-autocomplete
        array.push(data[i].name + data[i].email + '</span>');
      // array.push('<span class="name">' + data[i].name + '</span>' + '<span class="email">' data[i].email + '</span>');
      }

      $("#contacts").autocomplete({
        source: array
      });

      $scope.contacts = data;
    }).
    error(function (data, status, headers, config) {
      $scope.contacts = 'No GContact data!';
    });

  });
