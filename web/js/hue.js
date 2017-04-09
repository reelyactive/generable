angular.module('hue', [ 'ui.bootstrap' ])

  // Hue controller
  .controller('HueCtrl', function($scope, $http, $interval) {

    $scope.hue = {};

    $scope.getState = function() {
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'GET', url: '/hue' })
        .then(function(response) {
          $scope.hue = response.data;
        }, function(response) {
          $scope.hue = {};
      });
    };

    $scope.connectToBridge = function(ip) {
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'PUT', url: '/hue/bridges', data: { ip: ip } })
        .then(function(response) {
          $scope.hue.bridges = response.data;
        }, function(response) {
          $scope.hue.bridges = {};
      });
    };

    $scope.getState();

  });
