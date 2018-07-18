/**
 * Copyright reelyActive 2017-2018
 * We believe in an open Internet of Things
 */

const midi = require('midi');


const INTERFACE_ID = 'midiInterface';
const NOTE_ON = 0x90;
const NOTE_OFF = 0x80;
const DEFAULT_NOTE_DURATION = 60;
const DEFAULT_ASSIGNMENTS = [
  { source: "decoding", notes: "D maj (triad)", duration: "1/8" },
  { source: "appearance", notes: "D maj (triad)", duration: "4" },
  { source: "displacement", notes: "D maj (triad)", duration: "1/2" },
  { source: "disappearance", notes: "D maj (triad)", duration: "4" },
  { source: "none", notes: "Drum Kit", duration: "1/4" },
  { source: "none", notes: "Drum Kit", duration: "1/4" },
  { source: "none", notes: "Drum Kit", duration: "1/4" },
  { source: "none", notes: "Drum Kit", duration: "1/4" },
  { source: "none", notes: "Drum Kit", duration: "1/4" },
  { source: "none", notes: "Drum Kit", duration: "1/4" },
  { source: "none", notes: "Drum Kit", duration: "1/4" },
  { source: "none", notes: "Drum Kit", duration: "1/4" },
  { source: "none", notes: "Drum Kit", duration: "1/4" },
  { source: "none", notes: "Drum Kit", duration: "1/4" },
  { source: "none", notes: "Drum Kit", duration: "1/4" },
  { source: "none", notes: "Drum Kit", duration: "1/4" }
];
const DEFAULT_NOTES = {
  "Drum Kit": [ 36, 37, 38, 41, 42, 44, 46, 47, 48, 49, 51, 53, 60, 61, 62,
                63, 64, 65, 66, 67, 68, 69 ],
  "C maj": [ 60, 62, 64, 65, 67, 69, 71, 72 ],
  "C min": [ 60, 62, 63, 65, 67, 69, 70, 72 ],
  "D maj": [ 62, 64, 66, 67, 69, 71, 73, 74 ],
  "D min": [ 62, 64, 65, 67, 69, 71, 72, 74 ],
  "E maj": [ 64, 66, 68, 69, 71, 73, 75, 76 ],
  "E min": [ 64, 66, 67, 69, 71, 73, 74, 76 ],
  "F maj": [ 66, 68, 70, 71, 73, 75, 77, 78 ],
  "F min": [ 66, 68, 69, 71, 73, 75, 76, 78 ],
  "G maj": [ 67, 69, 71, 72, 74, 76, 78, 79 ],
  "G min": [ 67, 69, 70, 72, 74, 76, 77, 79 ],
  "A maj": [ 69, 71, 73, 74, 76, 78, 80, 81 ],
  "A min": [ 69, 71, 72, 74, 76, 78, 79, 81 ],
  "B maj": [ 71, 73, 75, 76, 78, 80, 82, 83 ],
  "B min": [ 71, 73, 74, 76, 78, 80, 81, 83 ],
  "C maj (triad)": [ 48, 51, 55, 60, 63, 67, 72 ],
  "D maj (triad)": [ 50, 53, 57, 62, 65, 69, 74 ],
  "E maj (triad)": [ 52, 55, 59, 64, 67, 71, 76 ],
  "F maj (triad)": [ 54, 57, 61, 66, 69, 73, 78 ],
  "G maj (triad)": [ 55, 58, 62, 67, 70, 74, 79 ],
  "A maj (triad)": [ 57, 60, 64, 69, 72, 76, 81 ],
  "B maj (triad)": [ 59, 62, 66, 71, 74, 78, 83 ]
};
const DEFAULT_DURATIONS = {
  "1/16": 30,
  "1/8": 60,
  "1/4": 120,
  "1/2": 240,
  "1": 480,
  "2": 960,
  "4": 1920,
  "8": 3840,
  "16": 7680
};


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
  self.io = options.io;

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
  
  updateInterface(self, index, self.assignments, function() {
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
 * Get the channel assignments.
 * @param {callback} callback Function to call on completion.
 */
MidiCtrl.prototype.getAssignments = function(callback) {
  var self = this;

  return callback(self.assignments);
};


/**
 * Set the given channel assignment.
 * @param {Number} channel The channel.
 * @param {Object} assignment The assignment.
 * @param {callback} callback Function to call on completion.
 */
MidiCtrl.prototype.setAssignment = function(channel, assignment, callback) {
  var self = this;

  self.assignments[channel] = assignment;

  var assignmentElement = {};
  assignmentElement['assignments.' + channel] = assignment;
  self.db.update({ _id: INTERFACE_ID },
                 { $set: assignmentElement },
                 { }, function() {
    console.log('MIDI channel assignment', channel, 'updated');
    return callback();
  });
};


/**
 * Handle the given generative event.
 * @param {String} event The type of event.
 * @param {String} id The identifier of the source.
 * @param {Number} velocity The velocity of the note.
 */
MidiCtrl.prototype.handleEvent = function(event, id, velocity) {
  var self = this;

  for(var cChannel = 0; cChannel < self.assignments.length; cChannel++) {
    var assignment = self.assignments[cChannel];

    if(assignment.source === event) {
      var notes = DEFAULT_NOTES[assignment.notes];
      var key = notes[parseInt(id, 16) % notes.length];
      var duration = DEFAULT_DURATIONS[assignment.duration];
      velocity = Math.max(1, Math.min(velocity, 127));
      self.sendNoteOnOff(cChannel, key, velocity, duration);
    }
  }
};


/**
 * Send MIDI message.
 * @param {callback} callback Function to call on completion.
 */
MidiCtrl.prototype.sendMessage = function(status, data1, data2) {
  var self = this;

  if(self.isConnected) {
    self.midiOut.sendMessage([status, data1, data2]);
    // TODO: socket.io message
  }
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
  var data;

  if(!self.isConnected) {
    return;
  }

  self.midiOut.sendMessage([NOTE_ON + channel, key, velocity]);    // Note on
  data = { type: 'Note On', channel: channel, key: key, velocity: velocity };
  self.io.emit('midi', { type: 'message', data: data });

  setTimeout(function() {
    self.midiOut.sendMessage([NOTE_OFF + channel, key, velocity]); // Note off
  }, duration || DEFAULT_NOTE_DURATION);
  data = { type: 'Note Off', channel: channel, key: key, velocity: velocity };
  self.io.emit('midi', { type: 'message', data: data });
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
      instance.assignments = doc.assignments;
      try {
        instance.midiOut.openPort(doc.index);
        instance.isConnected = true;
      }
      catch(err) {
        console.log('Could not open MIDI port', doc.index);
        instance.isConnected = false;
      }
    }
    else {
      instance.assignments = DEFAULT_ASSIGNMENTS;
      instance.db.update({ _id: INTERFACE_ID },
                         { _id: INTERFACE_ID,
                           assignments: DEFAULT_ASSIGNMENTS },
                         { upsert: true }, function() {
        console.log('MIDI default channel assignments selected');
      });
    }
  });
}


/**
 * Update the interface credentials in the database.
 * @param {MidiCtrl} instance The MidiCtrl instance.
 * @param {Number} index The index of the interface.
 * @param {Object} assignments The channel assignments.
 * @param {callback} callback Function to call on completion.
 */
function updateInterface(instance, index, assignments, callback) {
  instance.interfaceIndex = index;
  instance.midiOut = new midi.output();

  try {
    instance.midiOut.openPort(index);
    instance.isConnected = true;
  }
  catch(err) {
    console.log('Could not open MIDI port', index);
    instance.isConnected = false;
  }
  instance.assignments = assignments;

  instance.db.update({ _id: INTERFACE_ID },
                     { _id: INTERFACE_ID,
                       index: index,
                       assignments: assignments },
                     { upsert: true }, function() {
    console.log('MIDI interface updated');
    return callback();
  });
}

module.exports = MidiCtrl;
