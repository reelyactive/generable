/**
 * Copyright reelyActive 2017-2018
 * We believe in an open Internet of Things
 */


const MIDI_EVENTS_HISTORY = 5;

const SOURCES = [
  'none',
  'decoding',
  'appearance',
  'displacement',
  'disappearance'
];

const NOTES = [
  'Drum Kit',
  'C maj',
  'C min',
  'D maj',
  'D min',
  'E maj',
  'E min',
  'F maj',
  'F min',
  'G maj',
  'G min',
  'A maj',
  'A min',
  'B maj',
  'B min',
  'C maj (triad)',
  'D maj (triad)',
  'E maj (triad)',
  'F maj (triad)',
  'G maj (triad)',
  'A maj (triad)',
  'B maj (triad)'
];

const DURATIONS = [
  '1/16',
  '1/8',
  '1/4',
  '1/2',
  '1',
  '2',
  '4',
  '8',
  '16'
];


/**
 * midi Module
 */
angular.module('midi', [ 'ui.bootstrap' ])

  // Midi controller
  .controller('MidiCtrl', function($scope, $http, $location) {
    var socket = connectSocket();
    socket.on('midi', handleMessage);

    // Variables accessible in the HTML scope
    $scope.midi = { assignments: [], sources: SOURCES, notes: NOTES,
                    durations: DURATIONS };
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

    $scope.getAssignments = function() {
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'GET', url: '/midi/assignments' })
        .then(function(response) {
          $scope.midi.assignments = response.data;
        }, function(response) {
          $scope.midi.assignments = [];
      });
    };

    $scope.updateAssignment = function(channel, assignment) {
      var url = '/midi/assignments/' + channel;
      var data = { assignment: assignment };

      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'PUT', url: url, data: data })
        .then(function(response) {
          // All good
        }, function(response) {
          console.log('Assignment update failed.');
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
    $scope.getAssignments();

  });
