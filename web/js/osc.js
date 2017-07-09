angular.module('osc', [ 'ui.bootstrap' ])

  // OSC controller
  .controller('OscCtrl', function($scope, $http, $interval) {

    $scope.osc = {};

    $scope.getInterfaces = function() {
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'GET', url: '/osc/interfaces' })
        .then(function(response) {
          $scope.osc.interfaces = response.data;
        }, function(response) {
          $scope.osc.interfaces = {};
      });
    };

    $scope.selectInterface = function(localInterface, targetInterface) {
      var data = { localInterface: localInterface,
                   targetInterface: targetInterface };
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'PUT', url: '/osc/interfaces', data: data })
        .then(function(response) {
          $scope.osc.interfaces = response.data;
        }, function(response) {
          $scope.osc.interfaces = {};
      });
    };

    $scope.getInterfaces();

  });
