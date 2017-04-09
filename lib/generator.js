/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const alesisSR18 = [ 36, 37, 38, 41, 42, 44, 46, 47, 48, 49, 51, 53, 60, 61, 62,
                     63, 64, 65, 66, 67, 68, 69 ];

function handleGenerativeEvent(event, hue, midi) {
  if(hue) {
    var b = (event.rssi - 130) * 2;
    var h = parseInt(event.deviceId, 16) % 65536;
    var state = { hue: h, bri: b, sat: 255 };
    var id = Math.ceil(Math.random() * 3); 
    hue.setLightState(id, state);
  }
  if(midi) {
    var key = alesisSR18[parseInt(event.deviceId, 16) % alesisSR18.length];
    var velocity = (event.rssi - 130) * 2;
    midi.sendMessage(0x90, key, velocity);
  }
}

module.exports.handleGenerativeEvent = handleGenerativeEvent;
