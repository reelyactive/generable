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

    $scope.getState();

  });
