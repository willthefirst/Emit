'use strict';

/* Controllers */

angular.module('emit.controllers', []).
  controller('AppCtrl', function ($scope, $http) {

    $scope.contacts = "Here is the list of contacts static."

  }).
  controller('MyCtrl1', function ($scope) {
    // write Ctrl here

  }).
  controller('MyCtrl2', function ($scope) {
    // write Ctrl here

  });
