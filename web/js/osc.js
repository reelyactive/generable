/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */


const OSC_EVENTS_HISTORY = 5;


/**
 * osc Module
 */
angular.module('osc', [ 'ui.bootstrap' ])

  // OSC controller
  .controller('OscCtrl', function($scope, $http, $location) {
    var socket = connectSocket();
    socket.on('osc', handleMessage);

    // Variables accessible in the HTML scope
    $scope.osc = {};
    $scope.events = [];

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

    function connectSocket() {
      var url = $location.protocol() + '://' + $location.host() + ':' +
                $location.port();
      return io.connect(url);
    }

    function handleMessage(message) {
      if(message.type === 'message') {
        $scope.events.push(message.data);
        if($scope.events.length > OSC_EVENTS_HISTORY) {
          $scope.events.shift();
        }
      }
      $scope.$apply();
    }

    $scope.getInterfaces();

  });
