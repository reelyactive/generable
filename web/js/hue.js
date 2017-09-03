/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */


const HUE_EVENTS_HISTORY = 5;


/**
 * hue Module
 */
angular.module('hue', [ 'ui.bootstrap' ])

  // Hue controller
  .controller('HueCtrl', function($scope, $http, $location) {
    var socket = connectSocket();
    socket.on('hue', handleMessage);

    // Variables accessible in the HTML scope
    $scope.hue = {};
    $scope.fetchingBridges = true;
    $scope.events = [];

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

    function connectSocket() {
      var url = $location.protocol() + '://' + $location.host() + ':' +
                $location.port();
      return io.connect(url);
    }

    function handleMessage(message) {
      if(message.type === 'state') {
        $scope.events.push(message.data);
        if($scope.events.length > HUE_EVENTS_HISTORY) {
          $scope.events.shift();
        }
      }
      $scope.$apply();
    }

    $scope.getBridges();

  });
