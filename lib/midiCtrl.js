/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

var midi = require('midi');


/**
 * MidiCtrl Class
 * Controller for MIDI interface(s).
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function MidiCtrl(options) {
  var self = this;

  options = options || {};

  self.midiOut = new midi.output();
}


/**
 * Get the detected MIDI interfaces.
 * @param {callback} callback Function to call on completion.
 */
MidiCtrl.prototype.getInterfaces = function(callback) {
  var self = this;
  var list = [];

  var numberOfPorts = self.midiOut.getPortCount();
  for(var cPort = 0; cPort < numberOfPorts; cPort++) {
    list.push(self.midiOut.getPortName(cPort));
  } 

  callback(list);
}


/**
 * Get the current state.
 * @param {callback} callback Function to call on completion.
 */
MidiCtrl.prototype.getState = function(callback) {
  var self = this;

  self.getInterfaces(function(list) {
    callback(list); // TODO: make this the complete state
  });
}

module.exports = MidiCtrl;
