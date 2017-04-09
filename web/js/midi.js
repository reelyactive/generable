angular.module('midi', [ 'ui.bootstrap' ])

  // Hue controller
  .controller('MidiCtrl', function($scope, $http, $interval) {

    $scope.hue = {};

    $scope.getState = function() {
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'GET', url: '/midi' })
        .then(function(response) {
          $scope.midi = response.data;
        }, function(response) {
          $scope.midi = {};
      });
    };

    $scope.getState();

  });
