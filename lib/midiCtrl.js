/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const midi = require('midi');


const INTERFACE_ID = 'midiInterface';
const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const DEFAULT_NOTE_DURATION = 60;


/**
 * MidiCtrl Class
 * Controller for MIDI interface(s).
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function MidiCtrl(options) {
  var self = this;

  options = options || {};
  self.db = options.db;

  loadInterface(self);
}


/**
 * Get the detected MIDI interfaces.
 * @param {callback} callback Function to call on completion.
 */
MidiCtrl.prototype.getInterfaces = function(callback) {
  var self = this;
  var interfaces = [];

  var numberOfPorts = self.midiOut.getPortCount();
  for(var cPort = 0; cPort < numberOfPorts; cPort++) {
    var midiInterface = {
        index: cPort,
        description: self.midiOut.getPortName(cPort),
        selected: (cPort === self.interfaceIndex)
    }
    interfaces.push(midiInterface);
  } 

  callback(interfaces);
};


/**
 * Select the given MIDI interface.
 * @param {Number} index The index of the MIDI interface.
 * @param {callback} callback Function to call on completion.
 */
MidiCtrl.prototype.selectInterface = function(index, callback) {
  var self = this;
  
  updateInterface(self, index, function() {
    self.getInterfaces(function(interfaces) {
      callback(interfaces);
    });
  });
};


/**
 * Get the current state.
 * @param {callback} callback Function to call on completion.
 */
MidiCtrl.prototype.getState = function(callback) {
  var self = this;

  self.getInterfaces(function(list) {
    callback( { interfaces: list } );
  });
};


/**
 * Send MIDI message.
 * @param {callback} callback Function to call on completion.
 */
MidiCtrl.prototype.sendMessage = function(status, data1, data2) {
  var self = this;

  self.midiOut.sendMessage([status, data1, data2]);
};


/**
 * Send MIDI noteOn, and automatically send a corresponding noteOff after the
 * specified delay.
 * @param {Number} channel The channel number (0-15).
 * @param {Number} key The key number (0-127).
 * @param {Number} velocity The velocity (0-127).
 * @param {Number} duration The duration in milliseconds (0-127).
 */
MidiCtrl.prototype.sendNoteOnOff = function(channel, key, velocity, duration) {
  var self = this;

  self.midiOut.sendMessage([NOTE_ON + channel, key, velocity]);    // Note on

  setTimeout(function() {
    self.midiOut.sendMessage([NOTE_OFF + channel, key, velocity]); // Note off
  }, duration || DEFAULT_NOTE_DURATION);
};


/**
 * Load the interface credentials from the database.
 * @param {MidiCtrl} instance The MidiCtrl instance.
 */
function loadInterface(instance) {
  instance.midiOut = new midi.output();

  instance.db.findOne({ _id: INTERFACE_ID }, function (err, doc) {
    if(doc) {
      instance.interfaceIndex = doc.index;
      instance.midiOut.openPort(doc.index);
    }
  });
}


/**
 * Update the interface credentials in the database.
 * @param {MidiCtrl} instance The MidiCtrl instance.
 * @param {Number} index The index of the interface.
 * @param {callback} callback Function to call on completion.
 */
function updateInterface(instance, index, callback) {
  instance.interfaceIndex = index;
  instance.midiOut.closePort();
  instance.midiOut.openPort(index);

  instance.db.update({ _id: INTERFACE_ID },
                     { _id: INTERFACE_ID, index: index },
                     { upsert: true }, function() {
    console.log('MIDI interface index updated to ' + index);
    return callback();
  });
}

module.exports = MidiCtrl;
