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
const DEFAULT_PATCHES = [
  { bank: 29, instrument: 3, path: 'the_mysterious_bank_3/0004-echoes.xiz' },
  { bank: 14, instrument: 60, path: 'net-wisdom/0061-and Yet another one.xiz' },
  { bank: 14, instrument: 90, path: 'net-wisdom/0091-Noisy Tone-Percussion.xiz' },
  { bank: 14, instrument: 23, path: 'net-wisdom/0024-Rich Stereo Wind.xiz' },
  { bank: 15, instrument: 10, path: 'Noises/0065-Short noise.xiz' },
  { bank: 15, instrument: 10, path: 'Noises/0065-Short noise.xiz' },
  { bank: 15, instrument: 10, path: 'Noises/0065-Short noise.xiz' },
  { bank: 15, instrument: 10, path: 'Noises/0065-Short noise.xiz' },
  { bank: 15, instrument: 10, path: 'Noises/0065-Short noise.xiz' },
  { bank: 15, instrument: 10, path: 'Noises/0065-Short noise.xiz' },
  { bank: 15, instrument: 10, path: 'Noises/0065-Short noise.xiz' },
  { bank: 15, instrument: 10, path: 'Noises/0065-Short noise.xiz' },
  { bank: 15, instrument: 10, path: 'Noises/0065-Short noise.xiz' },
  { bank: 15, instrument: 10, path: 'Noises/0065-Short noise.xiz' },
  { bank: 15, instrument: 10, path: 'Noises/0065-Short noise.xiz' },
  { bank: 15, instrument: 10, path: 'Noises/0065-Short noise.xiz' }
];
const INSTRUMENT_ROOT_PATH = '/usr/local/share/zynaddsubfx/banks/';
const INSTRUMENT_LOAD_ROUTE = '/load_xiz';
const PART_ENABLED_ROUTE = '/Penabled';


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
  
  updateInterface(self, localInterface, targetInterface, self.patches,
                  function() {
    return callback();
  });
};


/**
 * Get the ZynAddSubFX patches.
 * @param {callback} callback Function to call on completion.
 */
ZynCtrl.prototype.getPatches = function(callback) {
  var self = this;

  return callback(self.patches);
};


/**
 * Set the given ZynAddSubFX patch.
 * @param {Number} channel The channel.
 * @param {Object} patch The patch.
 * @param {callback} callback Function to call on completion.
 */
ZynCtrl.prototype.setPatch = function(channel, patch, callback) {
  var self = this;
  var args = [
    { type: 'i', value: channel },
    { type: 's', value: INSTRUMENT_ROOT_PATH + patch.path }
  ]

  self.sendMessage(INSTRUMENT_LOAD_ROUTE, args);
  self.patches[channel] = patch;

  var patchElement = {};
  patchElement['patches.' + channel] = patch;
  self.db.update({ _id: INTERFACE_ID },
                 { $set: patchElement },
                 { }, function() {
    console.log('ZynAddSubFX patch', channel, 'updated');
    return callback();
  });
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
 * @param {ZynCtrl} instance The ZynCtrl instance.
 */
function loadInterface(instance) {
  instance.db.findOne({ _id: INTERFACE_ID }, function (err, doc) {
    if(doc) {
      instance.localInterface = doc.localInterface;
      instance.targetInterface = doc.targetInterface;
      instance.patches = doc.patches;
    }
    else {
      instance.localInterface = DEFAULT_LOCAL_INTERFACE;
      instance.targetInterface = DEFAULT_TARGET_INTERFACE;
      instance.patches = DEFAULT_PATCHES;
      updateInterface(instance, instance.localInterface,
                      instance.targetInterface, instance.patches,
                      function() {});
    }
    instance.udpPort = new osc.UDPPort(instance.localInterface);
    instance.udpPort.open();
    transmitPatches(instance, instance.patches);
  });
}


/**
 * Update the interface credentials in the database.
 * @param {ZynCtrl} instance The ZynCtrl instance.
 * @param {Object} localInterface The local interface.
 * @param {Object} targetInterface The target interface.
 * @param {Object} patches The patches.
 * @param {callback} callback Function to call on completion.
 */
function updateInterface(instance, localInterface, targetInterface, patches,
                         callback) {
  instance.localInterface = localInterface;
  instance.targetInterface = targetInterface;
  instance.patches = patches;

  instance.db.update({ _id: INTERFACE_ID },
                     { _id: INTERFACE_ID,
                       localInterface: localInterface,
                       targetInterface: targetInterface,
                       patches: patches },
                     { upsert: true }, function() {
    console.log('ZynAddSubFX interface updated');
    return callback();
  });
}


/**
 * Transmit all the patches to ZynAddSubFX.
 * @param {ZynCtrl} instance The ZynCtrl instance.
 * @param {Array} patches The array of patches to transmit.
 */
function transmitPatches(instance, patches) {
  for(var cPatch = 0; cPatch < patches.length; cPatch++) {
    var args = [
      { type: 'i', value: cPatch },
      { type: 's', value: INSTRUMENT_ROOT_PATH + patches[cPatch].path }
    ]

    instance.sendMessage(INSTRUMENT_LOAD_ROUTE, args);

    args = [ true ];
    instance.sendMessage('/part' + cPatch + PART_ENABLED_ROUTE, args);
  }
}


module.exports = ZynCtrl;
