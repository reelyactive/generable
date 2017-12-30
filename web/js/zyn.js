/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */


const BANKS = [
  'Arpeggios',
  'Bass',
  'Brass',
  'Choir and Voice',
  'Collection',
  'Companion',
  'Cormi_Noise',
  'Cormi_Sound',
  'Drums',
  'Dual',
  'Fantasy',
  'Guitar',
  'Laba170bank',
  'Misc',
  'net-wisdom',
  'Noises',
  'olivers-100',
  'olivers-other',
  'Organ',
  'Pads',
  'Plucked',
  'Reed and Wind',
  'Rhodes',
  'Splitted',
  'Strings',
  'Synth',
  'SynthPiano',
  'the_mysterious_bank',
  'the_mysterious_bank_2',
  'the_mysterious_bank_3',
  'the_mysterious_bank_4'
];

const INSTRUMENTS = [
  [
    '0001-Arpeggio1.xiz',
    '0002-Arpeggio2.xiz',
    '0003-Arpeggio3.xiz',
    '0004-Arpeggio4.xiz',
    '0005-Arpeggio5.xiz',
    '0006-Aporggio6.xiz',
    '0007-Arpeggio7.xiz',
    '0008-Arpeggio8.xiz',
    '0009-Arpeggio9.xiz',
    '0010-Arpeggio10.xiz',
    '0011-Arpeggio11.xiz',
    '0033-Sequence1.xiz',
    '0034-Sequence2.xiz',
    '0036-Echoed Synth.xiz',
    '0037-Echo FX.xiz',
    '0039-Soft Arpeggio1.xiz',
    '0040-Soft Arpeggio2.xiz',
    '0041-Soft Arpeggio3.xiz',
    '0042-Soft Arpeggio4.xiz',
    '0043-Soft Arpeggio5.xiz',
    '0065-Hyper Organ1.xiz',
    '0066-Hyper Arpeggio.xiz',
    '0068-Glass Arpeggio1.xiz',
    '0069-Glass Arpeggio2.xiz'
  ],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [ '0001-Drums Kit1.xiz' ],
  [],
  [],
  [],
  [],
  [],
  [],
  [
    '0001-Synth Effect.xiz',
    '0002-Ioioioioioi.xiz',
    '0003-Noise1.xiz',
    '0004-Noise2.xiz',
    '0006-Wind.xiz',
    '0033-Metal Sound 1.xiz',
    '0034-Metal Sound 2.xiz',
    '0035-Metal Sound 3.xiz',
    '0037-Metal Sound 4.xiz',
    '0038-Metal Sound 5.xiz',
    '0065-Short noise.xiz'
  ],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  []
];


/**
 * zyn Module
 */
angular.module('zyn', [ 'ui.bootstrap' ])

  // Zyn controller
  .controller('ZynCtrl', function($scope, $http, $location) {
    var socket = connectSocket();

    // Variables accessible in the HTML scope
    $scope.zyn = { patches: [], banks: BANKS, instruments: INSTRUMENTS };

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

    $scope.getPatches = function() {
      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'GET', url: '/zyn/patches' })
        .then(function(response) {
          $scope.zyn.patches = response.data;
        }, function(response) {
          $scope.zyn.patches = [];
      });
    };

    $scope.updatePatch = function(channel, patch) {
      var url = '/zyn/patches/' + channel;
      var data = { patch: patch };

      if(patch.instrument > INSTRUMENTS[patch.bank].length) {
        patch.instrument = 0;
      }
      patch.path = BANKS[patch.bank] + '/' +
                   INSTRUMENTS[patch.bank][patch.instrument];

      $http.defaults.headers.common.Accept = 'application/json';
      $http({ method: 'PUT', url: url, data: data })
        .then(function(response) {
          // All good
        }, function(response) {
          console.log('Patch update failed (currently unhandled).');
      });
    }

    function connectSocket() {
      var url = $location.protocol() + '://' + $location.host() + ':' +
                $location.port();
      return io.connect(url);
    }

    $scope.getInterfaces();
    $scope.getPatches();

  });
