angular.module('hue', [ 'ui.bootstrap' ])

  // Hue controller
  .controller('HueCtrl', function($scope, $http, $interval) {

    $scope.hue = {};
    $scope.fetchingBridges = true;

    $scope.getBridges = function() {
      $scope.fetchingBridges = true;
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'GET', url: '/hue/bridges' })
        .then(function(response) {
          $scope.hue.bridges = response.data;
          $scope.fetchingBridges = false;
        }, function(response) {
          $scope.hue.bridges = {};
          $scope.fetchingBridges = true;
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

    $scope.getLights = function() {
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'GET', url: '/hue/lights' })
        .then(function(response) {
          $scope.hue.lights = response.data;
        }, function(response) {
          $scope.hue.lights = {};
      });
    };

    $scope.getBridges();

  });
