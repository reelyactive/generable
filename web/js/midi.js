angular.module('midi', [ 'ui.bootstrap' ])

  // Hue controller
  .controller('MidiCtrl', function($scope, $http, $interval) {

    $scope.midi = {};

    $scope.getInterfaces = function() {
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'GET', url: '/midi/interfaces' })
        .then(function(response) {
          $scope.midi.interfaces = response.data;
        }, function(response) {
          $scope.midi.interfaces = {};
      });
    };

    $scope.selectInterface = function(index) {
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'PUT', url: '/midi/interfaces', data: { index: index } })
        .then(function(response) {
          $scope.midi.interfaces = response.data;
        }, function(response) {
          $scope.midi.interfaces = {};
      });
    };

    $scope.getInterfaces();

  });
