/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const osc = require('osc');


const INTERFACE_ID = 'zynInterface';
const DEFAULT_LOCAL_INTERFACE = { localAddress: "127.0.0.1",
                                  localPort: 6666 };
const DEFAULT_TARGET_INTERFACE = { targetAddress: "127.0.0.1",
                                   targetPort: 7777 };
const INSTRUMENT_ROOT_PATH = '/usr/local/share/zynaddsubfx/banks/';
const INSTRUMENT_LOAD_ROUTE = '/load_xiz';


/**
 * ZynCtrl Class
 * Controller for ZynAddSubFX interface (via OSC).
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function ZynCtrl(options) {
  var self = this;

  options = options || {};
  self.db = options.db;
  self.io = options.io;

  loadInterface(self);
}


/**
 * Get the ZynAddSubFX interfaces.
 * @param {callback} callback Function to call on completion.
 */
ZynCtrl.prototype.getInterfaces = function(callback) {
  var self = this;

  return callback( { localInterface: self.localInterface,
                     targetInterface: self.targetInterface } );
};


/**
 * Select the given ZynAddSubFX interfaces.
 * @param {Object} localInterface The local interface.
 * @param {Object} targetInterface The target interface.
 * @param {callback} callback Function to call on completion.
 */
ZynCtrl.prototype.selectInterface = function(localInterface, targetInterface,
                                             callback) {
  var self = this;
  
  updateInterface(self, localInterface, targetInterface, function() {
    return callback();
  });
};


/**
 * Set the given ZynAddSubFX patch.
 * @param {Object} patch The patch.
 * @param {callback} callback Function to call on completion.
 */
ZynCtrl.prototype.setPatch = function(patch, callback) {
  var self = this;
  var args = [
    { type: 'i', value: patch.channel },
    { type: 's', value: INSTRUMENT_ROOT_PATH + patch.instrument }
  ]

  self.sendMessage(INSTRUMENT_LOAD_ROUTE, args);
  return callback();
};


/**
 * Send OSC message.
 * @param {String} route The API route on the target.
 * @param {Array} args The arguments list.
 */
ZynCtrl.prototype.sendMessage = function(route, args) {
  var self = this;

  var message = { address: route, args: args };
  self.udpPort.send(message, self.targetInterface.targetAddress,
                    self.targetInterface.targetPort);
};



/**
 * Load the interface credentials from the database.
 * @param {OscCtrl} instance The OscCtrl instance.
 */
function loadInterface(instance) {
  instance.db.findOne({ _id: INTERFACE_ID }, function (err, doc) {
    if(doc) {
      instance.localInterface = doc.localInterface;
      instance.targetInterface = doc.targetInterface;
    }
    else {
      instance.localInterface = DEFAULT_LOCAL_INTERFACE;
      instance.targetInterface = DEFAULT_TARGET_INTERFACE;
    }
    instance.udpPort = new osc.UDPPort(instance.localInterface);
    instance.udpPort.open();
  });
}


/**
 * Update the interface credentials in the database.
 * @param {ZynCtrl} instance The ZynCtrl instance.
 * @param {String} localAddress The address of the local interface.
 * @param {Number} localPort The port of the local interface.
 * @param {String} targetAddress The address of the target interface.
 * @param {Number} targetPort The port of the target interface.
 * @param {callback} callback Function to call on completion.
 */
function updateInterface(instance, localInterface, targetInterface, callback) {
  instance.localInterface = localInterface;
  instance.targetInterface = targetInterface;

  instance.db.update({ _id: INTERFACE_ID },
                     { _id: INTERFACE_ID,
                       localInterface: localInterface,
                       targetInterface: targetInteface },
                     { upsert: true }, function() {
    console.log('ZynAddSubFX interface updated');
    return callback();
  });
}

module.exports = ZynCtrl;
