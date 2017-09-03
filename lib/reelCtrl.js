/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const util = require('util');
const events = require('events');
const reelib = require('reelib');
const barnowl = require('barnowl');
const barnacles = require('barnacles');
const Barnacles = barnacles.Barnacles;


const INTERFACE_ID = 'reelInterface';


/**
 * ReelCtrl Class
 * Controller for reel interface.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function ReelCtrl(options) {
  var self = this;

  options = options || {};

  self.middleware = new barnowl( { n: 3, enableMixing: true,
                                   mixingDelayMilliseconds: 240,
                                   minMixingDelayMilliseconds: 120 } );
  //self.notifications = new Barnacles(options.barnacles);
  //self.notifications.configureRoutes( { app: options.app } );
  //self.notifications.createWebSocket( { server: options.server } );
  self.db = options.db;
  self.io = options.io;
  self.reelMap = [];

  loadInterface(self);

  self.middleware.on('visibilityEvent', function(tiraid) {
    handleVisibilityEvent(self, tiraid);
  });

  self.middleware.on('reelEvent', function(event) {
    handleReelEvent(self, event);
  });

  events.EventEmitter.call(self);
}
util.inherits(ReelCtrl, events.EventEmitter);


/**
 * Get the detected reel interfaces.
 * @param {callback} callback Function to call on completion.
 */
ReelCtrl.prototype.getInterfaces = function(callback) {
  var self = this;
  var interfaces = [];

  interfaces.push({
    protocol: "hci",
    path: "n/a",
    selected: (self.interfaceProtocol === 'hci')
  });
  interfaces.push({
    protocol: "serial",
    path: "auto",
    selected: ((self.interfaceProtocol === 'serial') &&
               (self.interfacePath === 'auto'))
  });
  interfaces.push({
    protocol: "serial",
    path: "/dev/serial0",
    selected: ((self.interfaceProtocol === 'serial') &&
               (self.interfacePath === '/dev/serial0'))
  });

  callback(interfaces);
};


/**
 * Select the given reel interface.
 * @param {String} protocol The interface protocol.
 * @param {String} path The interface path.
 * @param {callback} callback Function to call on completion.
 */
ReelCtrl.prototype.selectInterface = function(protocol, path, callback) {
  var self = this;
  
  updateInterface(self, protocol, path, function() {
    self.getInterfaces(function(interfaces) {
      callback(interfaces);
    });
  });
};


/**
 * Get the current state.
 * @param {callback} callback Function to call on completion.
 */
ReelCtrl.prototype.getState = function(callback) {
  var self = this;

  callback({});
}


/**
 * Handle a visibility event.
 * @param {ReelCtrl} instance The ReelCtrl instance.
 * @param {Object} tiraid The visibility event tiraid.
 */
function handleVisibilityEvent(instance, tiraid) {

  // Handle events only once a reel map is established
  if(instance.reelMap.length === 0) {
    return;
  }

  var event = reelib.tiraid.toFlattened(tiraid);
  var rssiMap = [];
  var decodings = tiraid.radioDecodings;

  for(var cOffset = 0; cOffset < instance.reelMap.length; cOffset++) {
    var rssi = 0;

    for(var cDecoding = 0; cDecoding < decodings.length; cDecoding++) {
      if(decodings[cDecoding]) {
        var receiverId = decodings[cDecoding].identifier.value;
        if(receiverId === instance.reelMap[cOffset]) {
          rssi = decodings[cDecoding].rssi;
          break;
        }
      }
    }
    rssiMap.push(rssi);
  }
  event.rssi = rssiMap;
  event.maxRssi = decodings[0].rssi;
  event.tiraid = tiraid;

  instance.emit('visibilityEvent', event);
  instance.io.emit('reel', { type: 'visibility', data: event });
}


/**
 * Handle a reel event.
 * @param {ReelCtrl} instance The ReelCtrl instance.
 * @param {Object} event The reel event.
 */
function handleReelEvent(instance, event) {

  // Update the ordering of reelceivers in the reel
  if(event.type === 'reelMapState') {
    var reelMap = [];
    for(origin in event.origins) {
      var reelOffsets = event.origins[origin].reelOffsets;
      for(var cOffset = (reelOffsets.length - 1); cOffset >= 0; cOffset--) {
        reelMap.push(reelOffsets[cOffset]);
      }
    }
    instance.reelMap = reelMap;
  }
}


/**
 * Load the interface credentials from the database.
 * @param {ReelCtrl} instance The ReelCtrl instance.
 */
function loadInterface(instance) {
  instance.db.findOne({ _id: INTERFACE_ID }, function (err, doc) {
    if(doc) {
      instance.interfaceProtocol = doc.protocol;
      instance.interfacePath = doc.path;
      instance.middleware.bind( { protocol: doc.protocol, path: doc.path } );
    }
  });
}


/**
 * Update the interface credentials in the database.
 * @param {ReelCtrl} instance The ReelCtrl instance.
 * @param {String} protocol The interface protocol.
 * @param {String} path The interface path.
 * @param {callback} callback Function to call on completion.
 */
function updateInterface(instance, protocol, path, callback) {
  instance.interfaceProtocol = protocol;
  instance.interfacePath = path;
  instance.middleware.bind( { protocol: protocol, path: path } );

  instance.db.update({ _id: INTERFACE_ID },
                     { _id: INTERFACE_ID, protocol: protocol, path: path },
                     { upsert: true }, function() {
    console.log('Reel interface updated to ' + protocol + ' | ' + path);
    return callback();
  });
}

module.exports = ReelCtrl;
