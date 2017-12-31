/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const DECODING_MIDI_CHANNEL = 0;
const APPEARANCE_MIDI_CHANNEL = 1;
const DISPLACEMENT_MIDI_CHANNEL = 2;
const DISAPPEARANCE_MIDI_CHANNEL = 3;

const alesisSR18 = [ 36, 37, 38, 41, 42, 44, 46, 47, 48, 49, 51, 53, 60, 61, 62,
                     63, 64, 65, 66, 67, 68, 69 ];

const scale = [ 50, 53, 57, 62, 65, 69, 74 ];

/**
 * Handle a generative event by driving the corresponding output on the Hue
 * lights and MIDI.
 * @param {Object} event The visibility event (from the reel).
 * @param {HueCtrl} hue The Hue controller.
 * @param {MidiCtrl} midi The MIDI controller.
 * @param {OscCtrl} osc The OSC controller.
 */
function handleGenerativeEvent(event, hue, midi, osc) {
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
 * Produce a Hue light action based on the given event.
 * @param {HueCtrl} hue The Hue controller.
 * @param {Object} event The visibility event (from the reel).
 */
function eventToHue(hue, event) {
  var b = (event.maxRssi - 130) * 2;
  var h = parseInt(event.deviceId, 16) % 65536;
  var state = { hue: h, bri: b, sat: 255, transition: 0 };
  var lightIDs = hue.getLightIDs();
  var id = lightIDs[Math.floor(Math.random() * lightIDs.length)];

  // Same number of reelceivers as lights: map one to one
  if(event.rssi.length === lightIDs.length) {
    var index = 0;
    var maxRssi = 0;
    for(var cRssi = 0; cRssi < event.rssi.length; cRssi++) {
      if(event.rssi[cRssi] > maxRssi) {
        index = cRssi;
        maxRssi = event.rssi[cRssi];
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
    osc.sendMessage('/ble/acceleration', data.concat(event.rssi));
  }

  // Everything else -> Visibility message
  else {
    var data = [ event.deviceId ];
    osc.sendMessage('/ble/visibility', data.concat(event.rssi));
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


module.exports.handleGenerativeEvent = handleGenerativeEvent;
