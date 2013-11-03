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
      $scope.contacts = data;
    }).
    error(function (data, status, headers, config) {
      $scope.contacts = 'Shitastic!';
    });

  });
