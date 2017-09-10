/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */


const MASTER_COLOUR_RGB = [ 0x07, 0x70, 0xa2 ];
const APPEARANCE_COLOUR_RGB = [ 0xff, 0x69, 0x00 ];
const MIN_SQUARE_EDGE_PX = 128;
const BEAT_PERIOD_MILLISECONDS = 240;
const PERIODIC_MAINTENANCE_MILLISECONDS = BEAT_PERIOD_MILLISECONDS * 8;
const OSC_VOLUME_BASE = -20;
const SCALES = [
  [ 'E2', 'G2', 'B2', 'E3' ],
  [ 'D2', 'F2', 'A2', 'D3' ],
  [ 'C2', 'E2', 'G2', 'C3' ]
];


/**
 * squareshades Module
 */
angular.module('squareshades', [])

  // Scene controller
  .controller('SceneCtrl', function($scope, $location, $window) {
    var socket = connectSocket();
    var sceneWidth = 0;
    var sceneHeight = 0;
    var squareEdgePixels = MIN_SQUARE_EDGE_PX;
    var maxRssi = 0;
    var minRssi = 255;
    var sceneOsc = initialiseOscillator();
    var sceneSynth = initialiseSynth();
    initialiseTone();
    socket.on('reel', handleMessage);

    // Variables accessible in the HTML scope
    $scope.devices = [];

    function connectSocket() {
      var url = $location.protocol() + '://' + $location.host() + ':' +
                $location.port();
      return io.connect(url);
    }

    function handleMessage(message) {
      if(message.type === 'visibility') {
        var event = message.data;
        var isNewDevice = true;
        updateRssiStats(event.maxRssi);
        for(var cDevice = 0; cDevice < $scope.devices.length; cDevice++) {
          if($scope.devices[cDevice].event.deviceId === event.deviceId) {
            $scope.devices.splice(cDevice, 1);
            isNewDevice = false;
            break;
          }
        }
        if(isNewDevice) {
          playSynth(event);
        }
        var style = determineSquareStyle(event, isNewDevice);
        $scope.devices.push( { event: event, style: style } );
      }
      $scope.$apply();
    }

    function determineSquareStyle(event, isNew) {
      var style = { width: squareEdgePixels + 'px',
                    height: squareEdgePixels + 'px' };
      var rgb = isNew ? APPEARANCE_COLOUR_RGB : MASTER_COLOUR_RGB;
      var brightness = (event.maxRssi - minRssi) / (maxRssi - minRssi + 1);
      brightness = Math.max(0, Math.min(1, brightness));
      var r = ('0' + Math.round(brightness * rgb[0]).toString(16)).substr(-2);
      var g = ('0' + Math.round(brightness * rgb[1]).toString(16)).substr(-2);
      var b = ('0' + Math.round(brightness * rgb[2]).toString(16)).substr(-2);
      style['background-color'] = '#' + r + g + b;
      brightness = Math.max(0, 0.6 - brightness);
      r = ('0' + Math.round(brightness * rgb[0]).toString(16)).substr(-2);
      g = ('0' + Math.round(brightness * rgb[1]).toString(16)).substr(-2);
      b = ('0' + Math.round(brightness * rgb[2]).toString(16)).substr(-2);
      style.color = '#' + r + g + b;
      style['font-size'] = (squareEdgePixels / 4) + 'px';
      style['line-height'] = (squareEdgePixels / 2) + 'px';
      return style;
    }

    function updateRssiStats(rssi) {
      if(rssi > maxRssi) {
        maxRssi = rssi;
      }
      if(rssi < minRssi) {
        minRssi = rssi;
      }
    }

    function updateSceneDimensions() {
      var maxSquaresX = Math.floor($window.innerWidth / MIN_SQUARE_EDGE_PX);
      var maxSquaresY = Math.floor($window.innerHeight / MIN_SQUARE_EDGE_PX);
      sceneWidth = maxSquaresX * MIN_SQUARE_EDGE_PX;
      sceneHeight = maxSquaresY * MIN_SQUARE_EDGE_PX;
      var vMargin = Math.floor(($window.innerHeight - sceneHeight) / 2);
      $scope.sceneStyle = { width: sceneWidth + 'px',
                            height: sceneHeight + 'px',
                            margin: vMargin + 'px auto' };
    }

    function updateSquareDimensions() {
      var numberOfSquares = $scope.devices.length;
      var maxNumberOfSquares = (sceneWidth * sceneHeight) / 
                               (squareEdgePixels * squareEdgePixels);

      if(numberOfSquares > maxNumberOfSquares) {
        squareEdgePixels = Math.max(MIN_SQUARE_EDGE_PX, squareEdgePixels / 2);
      }
      else if(numberOfSquares < (maxNumberOfSquares / 4)) {
        squareEdgePixels = squareEdgePixels * 2;
      }
      else {
        return false;
      }
      var resizedDevices = [];
      for(var cDevice = 0; cDevice < $scope.devices.length; cDevice++) {
        var device = $scope.devices[cDevice];
        resizedDevices.push( { event: device.event,
                               style: determineSquareStyle(device.event) } );
      }
      $scope.devices = resizedDevices;
      return true;
    }

    function periodicMaintenance() {
      maxRssi = maxRssi - Math.round((maxRssi - minRssi) / 4);
      minRssi = minRssi + Math.round((maxRssi - minRssi) / 4);
      var staleThreshold = new Date().getTime()
                           - (PERIODIC_MAINTENANCE_MILLISECONDS * 4);
      for(var cDevice = 0; cDevice < $scope.devices.length; cDevice++) {
        var device = $scope.devices[cDevice];
        if(device.event.time < staleThreshold) {
          $scope.devices.splice(cDevice, 1);
        }
      }
      var isResized = updateSquareDimensions();
      if(isResized) {
        updateOscillator(sceneOsc);
      }
    }

    function initialiseTone() {
      Tone.Transport.bpm.value = 60 * 1000 / BEAT_PERIOD_MILLISECONDS;
    }

    function initialiseOscillator() {
      var pan = [];
      var osc = [];
      var basePanFreq = 1000 / BEAT_PERIOD_MILLISECONDS;
      pan.push(new Tone.AutoPanner(basePanFreq / 16).toMaster().start());
      pan.push(new Tone.AutoPanner(basePanFreq / 8).toMaster().start());
      pan.push(new Tone.AutoPanner(basePanFreq / 4).toMaster().start());
      osc.push(new Tone.AMOscillator(SCALES[0][0], "sine", "sine")
                       .connect(pan[0]).start());
      osc.push(new Tone.AMOscillator(SCALES[0][1], "sine", "sine")
                       .connect(pan[1]).start());
      osc.push(new Tone.AMOscillator(SCALES[0][2], "sine", "sine")
                       .connect(pan[2]).start());
      osc[0].volume.value = OSC_VOLUME_BASE;
      osc[1].volume.value = OSC_VOLUME_BASE;
      osc[2].volume.value = OSC_VOLUME_BASE;
      return osc;
    }

    function updateOscillator(osc) {
      var scaleIndex = Math.round(squareEdgePixels / MIN_SQUARE_EDGE_PX) - 1;
      scaleIndex = Math.max(0, Math.min(SCALES.length - 1, scaleIndex));
      osc[0].frequency.value = SCALES[scaleIndex][0];
      osc[1].frequency.value = SCALES[scaleIndex][1];
      osc[2].frequency.value = SCALES[scaleIndex][2];
    }

    function initialiseSynth() {
      var effect = new Tone.PingPongDelay({
        delayTime: BEAT_PERIOD_MILLISECONDS / 1000,
        maxDelayTime: BEAT_PERIOD_MILLISECONDS / 250
      }).toMaster();
      var synth = new Tone.MembraneSynth({
          pitchDecay: -0.2,
          octaves: 2,
          oscillator: { type:"sine" },
          envelope: {
            attack: 0.1,
            decay: 0.1,
            sustain: 0.01,
            release: 2.0,
            attackCurve: "exponential"
          }     
      }).connect(effect);
      return synth;
    }

    function playSynth(event) {
      var velocity = (event.maxRssi - minRssi) / (maxRssi - minRssi + 1);
      velocity = Math.max(0.33, Math.min(0.8, velocity));
      var scaleIndex = Math.round(squareEdgePixels / MIN_SQUARE_EDGE_PX) - 1;
      scaleIndex = Math.max(0, Math.min(SCALES.length - 1, scaleIndex));
      var note = SCALES[scaleIndex][3];
      if(event.deviceId.substr(0,1) < '4') {
        note = SCALES[scaleIndex][0];
      }
      else if(event.deviceId.substr(0,1) < '8') {
        note = SCALES[scaleIndex][1];
      }
      else if(event.deviceId.substr(0,1) < 'c') {
        note = SCALES[scaleIndex][2];
      }
      sceneSynth.triggerAttackRelease(note, '1n', '+128n', velocity);
    }

    updateSceneDimensions();

    setInterval(periodicMaintenance, PERIODIC_MAINTENANCE_MILLISECONDS);

  });
