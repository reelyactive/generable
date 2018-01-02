/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const RSSI_THRESHOLD = 150;
const STATS_PERIOD_MILLISECONDS = 4800;
const STATS_SAMPLES = 12;
const DECODING_MIDI_CHANNEL = 0;
const APPEARANCE_MIDI_CHANNEL = 1;
const DISPLACEMENT_MIDI_CHANNEL = 2;
const DISAPPEARANCE_MIDI_CHANNEL = 3;

const alesisSR18 = [ 36, 37, 38, 41, 42, 44, 46, 47, 48, 49, 51, 53, 60, 61, 62,
                     63, 64, 65, 66, 67, 68, 69 ];

const scale = [ 50, 53, 57, 62, 65, 69, 74 ];

var eventStats = { appearances: 0, displacements: 0, disappearances: 0 };
var reelStats = [];


/**
 * Handle a generative event by driving the corresponding output on the Hue
 * lights and MIDI.
 * @param {Object} event The visibility event (from the reel).
 * @param {HueCtrl} hue The Hue controller.
 * @param {MidiCtrl} midi The MIDI controller.
 * @param {OscCtrl} osc The OSC controller.
 */
function handleGenerativeEvent(event, hue, midi, osc) {
  if(isReelyActive(event)) {
    return;  // Ignore reelyActive infrastructure transmission bias
  }
  updateStats(event);
  if(hue) {
    eventToHue(hue, event);
  }
  if(midi) {
    eventToMIDI(midi, event);
  }
  if(osc) {
    eventToOSC(osc, event);
  }
}


/**
 * Initiate the periodic update of statistics.
 */
function initiateStats() {
  setInterval(function() {
    for(var cReelceiver = 0; cReelceiver < reelStats.length; cReelceiver++) {
      reelStats[cReelceiver].pps = 1000 * reelStats[cReelceiver].packets /
                                   STATS_PERIOD_MILLISECONDS;
      reelStats[cReelceiver].packets = 0;
    }
    // TODO: maintain eventStats
  }, STATS_PERIOD_MILLISECONDS);
}


/**
 * Update the decoding stats.
 * @param {Object} event The visibility event (from the reel).
 */
function updateStats(event) {
  var currentTime = new Date().getTime();

  switch(event.event) {
    case 'appearance':
      eventStats.appearances++;
      break;
    case 'displacement':
      eventStats.displacements++;
      break;
    case 'disappearance':
      eventStats.disappearances++;
      break;
    case 'decoding':
      if(event.rssi < RSSI_THRESHOLD) {
        break;  // Ignore decodings below the RSSI threshold
      }
      if(reelStats.length != event.rssiMap.length) {
        reelStats = [];  // (Re)create stats based on number of reelceivers
        for(var cReelceiver = 0; cReelceiver < event.rssiMap.length;
            cReelceiver++) {
          reelStats.push( { peak: 0, peakId: null, peakTime: 0, avg: 0,
                            samples: [], packets: 0, pps: 0 } );
        }
      }
      for(var cReelceiver = 0; cReelceiver < event.rssiMap.length;
          cReelceiver++) {  // Loop through each reelceiver
        var rssi = event.rssiMap[cReelceiver];

        if((rssi > reelStats[cReelceiver].peak) ||
           (event.deviceId === reelStats[cReelceiver].peakId) ||
           ((currentTime - reelStats[cReelceiver].peakTime) >
            STATS_PERIOD_MILLISECONDS)) {
          reelStats[cReelceiver].peak = Math.max(rssi, RSSI_THRESHOLD);
          reelStats[cReelceiver].peakId = event.deviceId;
          reelStats[cReelceiver].peakTime = currentTime;
        }

        if(rssi >= RSSI_THRESHOLD) {
          reelStats[cReelceiver].packets++;
        }
        reelStats[cReelceiver].samples.push(Math.max(rssi, RSSI_THRESHOLD));
        if(reelStats[cReelceiver].samples.length > STATS_SAMPLES) {
          reelStats[cReelceiver].samples.shift();
        }
        var sum = 0;
        for(var cSample = 0; cSample < reelStats[cReelceiver].samples.length;
            cSample++) {
          sum += reelStats[cReelceiver].samples[cSample];
        }
        reelStats[cReelceiver].avg = Math.round(sum /
                                       reelStats[cReelceiver].samples.length);
      }
      break;
  }
}


/**
 * Produce a Hue light action based on the given event.
 * @param {HueCtrl} hue The Hue controller.
 * @param {Object} event The visibility event (from the reel).
 */
function eventToHue(hue, event) {
  var b = (event.rssi - 130) * 2;
  var h = parseInt(event.deviceId, 16) % 65536;
  var state = { hue: h, bri: b, sat: 255, transition: 0 };
  var lightIDs = hue.getLightIDs();
  var id = lightIDs[Math.floor(Math.random() * lightIDs.length)];

  // Same number of reelceivers as lights: map one to one
  if(event.rssi.length === lightIDs.length) {
    var index = 0;
    var maxRssi = 0;
    for(var cRssi = 0; cRssi < event.rssiMap.length; cRssi++) {
      if(event.rssiMap[cRssi] > maxRssi) {
        index = cRssi;
        maxRssi = event.rssiMap[cRssi];
      }
    }
    id = lightIDs[index];
  }
 
  hue.setLightState(id, state);
}


/**
 * Produce a MIDI action based on the given event.
 * @param {MidiCtrl} hue The MIDI controller.
 * @param {Object} event The visibility event (from the reel).
 */
function eventToMIDI(midi, event) {
  var sensorData = getEventSensorData(event);

  // Sensor data -> Controller
  if(sensorData) {
    var status = 0xb0; // Control change (+ channel)
    var data1 = 0x01;  // Control number 1 = modulation
    var data2 = ((Math.round(sensorData.roll * 32) + 64) % 127);  // Value
    midi.sendMessage(status, data1, data2);
  }

  // Everything else -> Note
  else {
    var key = scale[parseInt(event.deviceId, 16) % scale.length];
    var velocity = (event.rssi - 130) * 2;
    var duration = 60;

    switch(event.event) {
      case 'decoding':
        midi.sendNoteOnOff(DECODING_MIDI_CHANNEL, key, velocity, duration);
        break;
      case 'appearance':
        duration = 3600;
        midi.sendNoteOnOff(APPEARANCE_MIDI_CHANNEL, key, velocity, duration);
        break;
      case 'displacement':
        duration = 1200;
        midi.sendNoteOnOff(DISPLACEMENT_MIDI_CHANNEL, key, velocity, duration);
        break;
      case 'disappearance':
        duration = 3600;
        midi.sendNoteOnOff(DISAPPEARANCE_MIDI_CHANNEL, key, velocity, duration);
        break;
    }
  }
}


/**
 * Produce an OSC message based on the given event.
 * @param {OscCtrl} osc The OSC controller.
 * @param {Object} event The visibility event (from the reel).
 */
function eventToOSC(osc, event) {
  var sensorData = getEventSensorData(event);

  // Sensor data -> Acceleration message
  if(sensorData) {
    var data = [ event.deviceId, sensorData.accelerationX,
                 sensorData.accelerationY, sensorData.accelerationZ,
                 sensorData.roll, sensorData.pitch ];
    osc.sendMessage('/ble/acceleration', data.concat(event.rssiMap));
  }

  // Everything else -> Visibility message
  else {
    var data = [ event.deviceId ];
    osc.sendMessage('/ble/visibility', data.concat(event.rssiMap));
  }
}


/**
 * Extract sensor data, if any, from the given event.
 * @param {Object} event The visibility event (from the reel).
 */
function getEventSensorData(event) {
  if(event.hasOwnProperty('tiraid') &&
     event.tiraid.hasOwnProperty('identifier') &&
     event.tiraid.identifier.hasOwnProperty('advData') &&
     event.tiraid.identifier.advData.hasOwnProperty('serviceData') &&
     event.tiraid.identifier.advData.serviceData.hasOwnProperty('minew')) {
    var data = event.tiraid.identifier.advData.serviceData.minew;
    if(data.productModel === 3) {
      return {
        accelerationX: data.accelerationX,
        accelerationY: data.accelerationY,
        accelerationZ: data.accelerationZ,
        roll: calculateOrientationAngle(data.accelerationX),
        pitch: calculateOrientationAngle(data.accelerationY)
      };
    }
  }

  return null;
}


/**
 * Calculate the orientation angle from the acceleration in the given axis.
 * @param {Number} acceleration The acceleration in the given axis.
 */
function calculateOrientationAngle(acceleration) {
  return ((Math.acos(acceleration) * 2 / Math.PI) - 1);
}


/**
 * Determine if the event is a decoding of reelyActive infrastructure.
 * @param {Object} event The event.
 */
function isReelyActive(event) {
  if(event.hasOwnProperty('tiraid') &&
     event.tiraid.hasOwnProperty('identifier') &&
     event.tiraid.identifier.hasOwnProperty('advData') &&
     event.tiraid.identifier.advData.hasOwnProperty('complete128BitUUIDs') &&
     (event.tiraid.identifier.advData.complete128BitUUIDs === 
                                        '7265656c794163746976652055554944')) {
    return true;
  }
  else if(event.hasOwnProperty('deviceAssociationIds') &&
          (event.deviceAssociationIds.indexOf(
                                  '7265656c794163746976652055554944') >= 0)) {
    return true;
  }
  return false;
}


module.exports.handleGenerativeEvent = handleGenerativeEvent;
module.exports.initiateStats = initiateStats;
