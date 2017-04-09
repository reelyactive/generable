angular.module('reel', [ 'ui.bootstrap' ])

  // Hue controller
  .controller('ReelCtrl', function($scope, $http, $interval) {

    $scope.hue = {};

    $scope.getState = function() {
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'GET', url: '/reel' })
        .then(function(response) {
          $scope.reel = response.data;
        }, function(response) {
          $scope.reel = {};
      });
    };

    $scope.getState();

  });
