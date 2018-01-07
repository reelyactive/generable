/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const RSSI_THRESHOLD = 150;
const STATS_PERIOD_MILLISECONDS = 4800;
const BREATHING_BASE_MILLISECONDS = 2400;
const STATS_SAMPLES = 12;
const MAX_RSSI = 193;
const MIN_RSSI = RSSI_THRESHOLD;
const DECODING_MIDI_CHANNEL = 0;
const APPEARANCE_MIDI_CHANNEL = 1;
const DISPLACEMENT_MIDI_CHANNEL = 2;
const DISAPPEARANCE_MIDI_CHANNEL = 3;
const SENSOR_MIDI_CHANNEL = 4;
const BASE_HUE = 8192;

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
 * @param {Boolean} breatheIn The direction in which to breathe.
 */
function breathing(hue, breatheIn) {
  var pps = 0;
  var bri = [];

  for(var cReelceiver = 0; cReelceiver < reelStats.length; cReelceiver++) {
    if(reelStats[cReelceiver].pps > pps) {
      pps = reelStats[cReelceiver].pps;
    }
    if(breatheIn) {
      bri.push(Math.max(0, Math.floor(255 * (reelStats[cReelceiver].peak -
                                      MIN_RSSI) / (MAX_RSSI - MIN_RSSI))));
    }
    else {
      bri.push(Math.max(0, Math.floor(64 * (reelStats[cReelceiver].avg -
                                      MIN_RSSI) / (MAX_RSSI - MIN_RSSI))));
    }
  }
  var divisor = Math.max(1, Math.log(pps));
  var transition = Math.round(BREATHING_BASE_MILLISECONDS / divisor);
  var lightIDs = hue.getLightIDs();
  
  for(var cReelceiver = 0; cReelceiver < reelStats.length; cReelceiver++) {
    if(cReelceiver < lightIDs.length) {
      var state = { bri: bri[cReelceiver], transition: transition - 20 };
      var id = hue.getLightIDs()[cReelceiver];
      hue.setLightState(id, state);
    }
  }

  setTimeout(breathing, transition, hue, !breatheIn);
}


/**
 * Produce a Hue light action based on the given event.
 * @param {HueCtrl} hue The Hue controller.
 * @param {Object} event The visibility event (from the reel).
 */
function eventToHue(hue, event) {
  if(!((event.event === 'appearance') || (event.event === 'displacement') ||
       (event.event === 'disappearance'))) {
    return;
  } 
  var numberOfReelceivers = reelStats.length;
  var numberOfLights = hue.getLightIDs().length;

  for(var cLight = numberOfReelceivers; cLight < numberOfLights; cLight++) {
    var h = BASE_HUE + parseInt(event.deviceId, 16) % 1024;
    var b = Math.min(255, Math.round((reelStats[0].pps || 1) * 32));
    var s = 250;
    var t = 0;
    if(event.event === 'appearance') {
      b = Math.min(255, Math.round(b * 1.5));
      s = 255;
      t = 4800;
    }
    else if(event.event === 'disappearance') {
      b = Math.max(0, Math.round(b * 0.6));
      s = 245;
      t = 4800;
    }
    var state = { hue: h, bri: b, sat: s, transition: t };
    var id = hue.getLightIDs()[cLight];
    hue.setLightState(id, state);
  }
}


/**
 * Produce a MIDI action based on the given event.
 * @param {MidiCtrl} hue The MIDI controller.
 * @param {Object} event The visibility event (from the reel).
 */
function eventToMIDI(midi, event) {
  var sensorData = getEventSensorData(event);

  // Minew I7 sensor data -> Pan & Expression Controllers on Channel 0
  if(sensorData && (sensorData.type === 'Minew-I7')) {
    var status = 0xb0; // Control change (+ channel 0)
    var data1 = 0x0a;  // Control number 10 = pan
    var data2 = (Math.round(sensorData.roll * 32) + 64) % 127;  // Value
    midi.sendMessage(status, data1, data2);

    data1 = 0x0b;      // Control number 11 = expression
    data2 = (Math.round(sensorData.pitch * 32) + 64) % 127;     // Value
    midi.sendMessage(status, data1, data2);
  }

  // puckyActive sensor data -> Controllers & Note
  else if(sensorData && (sensorData.type === 'puckyActive')) {
    var status = 0xb4; // Control change (+ channel 4)
    var data1 = 0x0b;  // Control number 11 = expression
    var data2 = 127 - Math.round((sensorData.magneticFieldX + 32768) / 1024);
    midi.sendMessage(status, data1, data2);

    data1 = 0x4a;  // Control number 74 = filter cutoff
    data2 = 127 - Math.round((sensorData.magneticFieldY + 32768) / 2048);

    data1 = 0x0a;  // Control number 10 = pan
    data2 = Math.round(127 * (sensorData.magneticFieldZ + 32768) / 65536);
    midi.sendMessage(status, data1, data2);

    var key = scale[Math.floor(scale.length * sensorData.lightPercentage / 100)];
    var velocity = (event.rssi - 130) * 2;
    var duration = 60;
    midi.sendNoteOnOff(SENSOR_MIDI_CHANNEL, key, velocity, duration);
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
        type: 'Minew-I7',
        accelerationX: data.accelerationX,
        accelerationY: data.accelerationY,
        accelerationZ: data.accelerationZ,
        roll: calculateOrientationAngle(data.accelerationX),
        pitch: calculateOrientationAngle(data.accelerationY)
      };
    }
  }
  if(event.hasOwnProperty('tiraid') &&
     event.tiraid.hasOwnProperty('identifier') &&
     event.tiraid.identifier.hasOwnProperty('advData') &&
     event.tiraid.identifier.advData.hasOwnProperty('manufacturerSpecificData') &&
     event.tiraid.identifier.advData.manufacturerSpecificData.hasOwnProperty(
                                                              'puckyActive')) {
     var puckyActive =
          event.tiraid.identifier.advData.manufacturerSpecificData.puckyActive;
     return {
       type: 'puckyActive',
       temperature: puckyActive.temperature,
       lightPercentage: puckyActive.lightPercentage,
       capSensePercentage: puckyActive.capSensePercentage,
       magneticFieldX: puckyActive.magneticFieldX,
       magneticFieldY: puckyActive.magneticFieldY,
       magneticFieldZ: puckyActive.magneticFieldZ
     };
  }

  return null;
}


/**
 * Calculate the orientation angle from the acceleration in the given axis.
 * @param {Number} acceleration The acceleration in the given axis.
 */
function calculateOrientationAngle(acceleration) {
  if(acceleration > 1) {
    return -1;
  }
  if(acceleration < -1) {
    return 1;
  }
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
module.exports.breathing = breathing;
