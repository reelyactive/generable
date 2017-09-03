/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */


const REEL_EVENTS_HISTORY = 5;


/**
 * reel Module
 */
angular.module('reel', [ 'ui.bootstrap' ])

  // Reel controller
  .controller('ReelCtrl', function($scope, $http, $location) {
    var socket = connectSocket();
    socket.on('reel', handleMessage);

    // Variables accessible in the HTML scope
    $scope.reel = {};
    $scope.events = [];

    $scope.getInterfaces = function() {
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'GET', url: '/reel/interfaces' })
        .then(function(response) {
          $scope.reel.interfaces = response.data;
        }, function(response) {
          $scope.reel.interfaces = {};
      });
    };

    $scope.selectInterface = function(protocol, path) {
      var data = { protocol: protocol, path: path };
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'PUT', url: '/reel/interfaces', data: data })
        .then(function(response) {
          $scope.reel.interfaces = response.data;
        }, function(response) {
          $scope.reel.interfaces = {};
      });
    };

    $scope.getState = function() {
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'GET', url: '/reel' })
        .then(function(response) {
          $scope.reel = response.data;
        }, function(response) {
          $scope.reel = {};
      });
    };

    function connectSocket() {
      var url = $location.protocol() + '://' + $location.host() + ':' +
                $location.port();
      return io.connect(url);
    }

    function handleMessage(message) {
      if(message.type === 'visibility') {
        $scope.events.push(message.data);
        if($scope.events.length > REEL_EVENTS_HISTORY) {
          $scope.events.shift();
        }
      }
      $scope.$apply();
    }

    $scope.getInterfaces();
    //$scope.getState();

  });
