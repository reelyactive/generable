/**
 * Copyright reelyActive 2019
 * We believe in an open Internet of Things
 */


// Constants
const TONE_JS_SRC = '../../js/Tone.js';
const DEFAULT_RSSI_THRESHOLD = -50;
const MAX_RSSI = -30;
const MIN_RSSI = -100;
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
let rssiThreshold = DEFAULT_RSSI_THRESHOLD;
let proximitySynth;
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


// Initialise Tone's synths (and more)
function initialiseTone() {
  let pingPong = new Tone.PingPongDelay("16n", 0.2).toMaster();
  proximitySynth = new Tone.PolySynth(4, Tone.Synth, PROXIMITY_SYNTH_OPTIONS);
  proximitySynth.connect(pingPong);
  isToneInitialised = true;
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


soundToggle.addEventListener('click', toggleSound);
rssiThresholdInput.addEventListener('change', updateRssiThreshold);
