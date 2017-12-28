/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */


const INSTRUMENTS = [
  'Noises/0001-Synth Effect.xiz',
  'Noises/0002-Ioioioioioi.xiz',
  'Noises/0003-Noise1.xiz',
  'Noises/0004-Noise2.xiz',
  'Noises/0006-Wind.xiz',
  'Noises/0033-Metal Sound 1.xiz',
  'Noises/0034-Metal Sound 2.xiz',
  'Noises/0035-Metal Sound 3.xiz',
  'Noises/0037-Metal Sound 4.xiz',
  'Noises/0038-Metal Sound 5.xiz',
  'Noises/0065-Short noise.xiz'
];


/**
 * zyn Module
 */
angular.module('zyn', [ 'ui.bootstrap' ])

  // Zyn controller
  .controller('ZynCtrl', function($scope, $http, $location) {
    var socket = connectSocket();

    // Variables accessible in the HTML scope
    $scope.zyn = { instrument: INSTRUMENTS[10], instruments: INSTRUMENTS };

    $scope.getInterfaces = function() {
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'GET', url: '/zyn/interfaces' })
        .then(function(response) {
          $scope.zyn.interfaces = response.data;
        }, function(response) {
          $scope.zyn.interfaces = {};
      });
    };

    $scope.selectInterface = function(localInterface, targetInterface) {
      var data = { localInterface: localInterface,
                   targetInterface: targetInterface };
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'PUT', url: '/zyn/interfaces', data: data })
        .then(function(response) {
          $scope.zyn.interfaces = response.data;
        }, function(response) {
          $scope.zyn.interfaces = {};
      });
    };

    $scope.updateInstrument = function(channel, instrument) {
      var data = { patch: { channel: channel, instrument: instrument } };
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'PUT', url: '/zyn/patches', data: data })
        .then(function(response) {
          // All good
        }, function(response) {
          $scope.zyn.instrument = 'Patch failed';
      });
    }

    function connectSocket() {
      var url = $location.protocol() + '://' + $location.host() + ':' +
                $location.port();
      return io.connect(url);
    }

    $scope.getInterfaces();

  });
