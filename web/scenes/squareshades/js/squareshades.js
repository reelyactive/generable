/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */


const MASTER_COLOUR_RGB = [ 0x07, 0x70, 0xa2 ];
const MIN_SQUARE_EDGE_PX = 128;
const PERIODIC_MAINTENANCE_MILLISECONDS = 1920;


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
        updateRssiStats(event.maxRssi);
        for(var cDevice = 0; cDevice < $scope.devices.length; cDevice++) {
          if($scope.devices[cDevice].event.deviceId === event.deviceId) {
            $scope.devices.splice(cDevice, 1);
            break;
          }
        }
        $scope.devices.push( { event: event,
                               style: determineSquareStyle(event) } );
      }
      $scope.$apply();
    }

    function determineSquareStyle(event) {
      var style = { width: squareEdgePixels + 'px',
                    height: squareEdgePixels + 'px' };
      var brightness = (event.maxRssi - minRssi) / (maxRssi - minRssi + 1);
      var r = ('0' + Math.round(brightness*MASTER_COLOUR_RGB[0]).toString(16))
              .substr(-2);
      var g = ('0' + Math.round(brightness*MASTER_COLOUR_RGB[1]).toString(16))
              .substr(-2);
      var b = ('0' + Math.round(brightness*MASTER_COLOUR_RGB[2]).toString(16))
              .substr(-2);
      style['background-color'] = '#' + r + g + b;
      brightness = Math.max(0, 0.6 - brightness);
      r = ('0' + Math.round(brightness * MASTER_COLOUR_RGB[0]).toString(16))
          .substr(-2);
      g = ('0' + Math.round(brightness * MASTER_COLOUR_RGB[1]).toString(16))
          .substr(-2);
      b = ('0' + Math.round(brightness * MASTER_COLOUR_RGB[2]).toString(16))
          .substr(-2);
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
        return;
      }
      var resizedDevices = [];
      for(var cDevice = 0; cDevice < $scope.devices.length; cDevice++) {
        var device = $scope.devices[cDevice];
        resizedDevices.push( { event: device.event,
                               style: determineSquareStyle(device.event) } );
      }
      $scope.devices = resizedDevices;
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
      updateSquareDimensions();
    }

    updateSceneDimensions();

    setInterval(periodicMaintenance, PERIODIC_MAINTENANCE_MILLISECONDS);

  });
