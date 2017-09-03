/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */


const MIDI_EVENTS_HISTORY = 5;


/**
 * midi Module
 */
angular.module('midi', [ 'ui.bootstrap' ])

  // Midi controller
  .controller('MidiCtrl', function($scope, $http, $location) {
    var socket = connectSocket();
    socket.on('midi', handleMessage);

    // Variables accessible in the HTML scope
    $scope.midi = {};
    $scope.events = [];

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

    function connectSocket() {
      var url = $location.protocol() + '://' + $location.host() + ':' +
                $location.port();
      return io.connect(url);
    }

    function handleMessage(message) {
      if(message.type === 'message') {
        $scope.events.push(message.data);
        if($scope.events.length > MIDI_EVENTS_HISTORY) {
          $scope.events.shift();
        }
      }
      $scope.$apply();
    }

    $scope.getInterfaces();

  });
