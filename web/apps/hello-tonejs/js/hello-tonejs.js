/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


// Constants
const TONE_JS_SRC = '../../js/Tone.js';
const DEFAULT_RSSI_THRESHOLD = -50;
const MAX_RSSI = -30;
const MIN_RSSI = -100;
const DEFAULT_RECEIVER_OSC_VOLUME = -30;
const OFFSET_RECEIVER_OSC_VOLUME = 12;
const SOUND_ON_ICON = 'fas fa-bell';
const SOUND_OFF_ICON = 'fas fa-bell-slash';
const MAJOR_TRIAD = [ 1.0, 1.25, 1.5, 2.0 ];
const MINOR_TRIAD = [ 1.0, 1.189, 1.5, 2.0 ];
const PROXIMITY_SYNTH_OPTIONS = {
    oscillator: {
      type: "sine",
      partialCount: 1,
      count: 7,
      spread: 20
    },
    envelope: {
      attack: 0.02,
      decay: 0.08,
      sustain: 0.01,
      release: 0.32,
      attackCurve: "sine",
      decayCurve: "exponential",
      releaseCurve: "cosine"
    }
};

// DOM elements
let soundToggle = document.querySelector('#soundToggle');
let rssiThresholdInput = document.querySelector('#rssiThresholdInput');

// Other variables
let isSoundEnabled = false;
let isToneLoaded = false;
let isToneInitialised = false;
let receivers = [];
let rssiThreshold = DEFAULT_RSSI_THRESHOLD;
let proximitySynth;
let receiversPan = [];
let receiversOsc = [];
let scale = MAJOR_TRIAD;

// Connect to the socket.io stream and feed to beaver
let baseUrl = window.location.protocol + '//' + window.location.hostname +
              ':' + window.location.port;
let socket = io.connect(baseUrl);
beaver.listen(socket, true);

// Non-disappearance events
beaver.on([ 0, 1, 2, 3 ], function(raddec) {
  if(isToneInitialised && isSoundEnabled) {
    let rssi = raddec.rssiSignature[0].rssi;
    if(rssi > rssiThreshold) {
      let freq = scale[parseInt(raddec.transmitterId, 16) % scale.length] *
                 440;
      let velocity = (rssi - MIN_RSSI) / (MAX_RSSI - MIN_RSSI);
      proximitySynth.triggerAttackRelease(freq, '22n', Tone.now(), velocity);
    }
  }
});


// Update the receiver stats
function updateReceivers() {
  let totalTransmitterCount = 0;

  receivers.forEach(function(receiver) {
    receiver.transmitterCount = 0;
  });

  for(transmitterId in beaver.transmitters) {
    let transmitter = beaver.transmitters[transmitterId];
    let receiverId = transmitter.raddec.rssiSignature[0].receiverId;
    let isKnownReceiver = false;
    totalTransmitterCount++;

    receivers.forEach(function(receiver) {
      if(receiver.id === receiverId) {
        receiver.transmitterCount++;
        isKnownReceiver = true;
      }
    });

    if(!isKnownReceiver) {
      receivers.push({ id: receiverId, transmitterCount: 1 });
    }
  }

  if(isToneInitialised && isSoundEnabled) {
    receivers.forEach(function(receiver, index) {
      if(index < receiversOsc.length) {
        let volume = (receiver.transmitterCount / totalTransmitterCount) *
                     OFFSET_RECEIVER_OSC_VOLUME + DEFAULT_RECEIVER_OSC_VOLUME;
        receiversOsc[index].volume.value = volume;
        receiversPan[index].start();
        receiversOsc[index].start();
      }
    });
  }
}


// Initialise Tone's synths (and more)
function initialiseTone() {
  let pingPong = new Tone.PingPongDelay("16n", 0.2).toMaster();
  proximitySynth = new Tone.PolySynth(4, Tone.Synth, PROXIMITY_SYNTH_OPTIONS);
  proximitySynth.connect(pingPong);
  isToneInitialised = true;

  receiversPan.push(new Tone.AutoPanner(0.25).toMaster());
  receiversPan.push(new Tone.AutoPanner(0.50).toMaster());
  receiversPan.push(new Tone.AutoPanner(1.00).toMaster());
  receiversOsc.push(new Tone.AMOscillator("C2", "sine", "sine")
                            .connect(receiversPan[0]));
  receiversOsc.push(new Tone.AMOscillator("E2", "sine", "sine")
                            .connect(receiversPan[1]));
  receiversOsc.push(new Tone.AMOscillator("G2", "sine", "sine")
                            .connect(receiversPan[2]));
  receiversOsc[0].volume.value = DEFAULT_RECEIVER_OSC_VOLUME;
  receiversOsc[1].volume.value = DEFAULT_RECEIVER_OSC_VOLUME;
  receiversOsc[2].volume.value = DEFAULT_RECEIVER_OSC_VOLUME;
}


// Toggle sound on/off
function toggleSound() {
  let i = document.createElement('i');

  if(isSoundEnabled) {
    i.setAttribute('class', SOUND_OFF_ICON);
  }
  else {
    i.setAttribute('class', SOUND_ON_ICON);

    if(!isToneLoaded) {
      loadToneJS(initialiseTone);
    }
  }

  soundToggle.innerHTML = '';
  soundToggle.appendChild(i);
  isSoundEnabled = !isSoundEnabled;
}


// Update the RSSI threshold
function updateRssiThreshold() {
  rssiThreshold = rssiThresholdInput.value;
}


// Dynamically load Tone.js
function loadToneJS(callback) {
  let script = document.createElement('script');
  script.onload = function () {
    isToneLoaded = true;
    Tone.start();
    callback();
  };
  script.src = TONE_JS_SRC;

  document.head.appendChild(script);
}


setInterval(updateReceivers, 1000);


soundToggle.addEventListener('click', toggleSound);
rssiThresholdInput.addEventListener('change', updateRssiThreshold);
