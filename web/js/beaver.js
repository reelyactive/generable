/**
 * Copyright reelyActive 2016-2019
 * We believe in an open Internet of Things
 */


let beaver = (function() {

  // Internal constants
  const SIGNATURE_SEPARATOR = '/';
  const ALL_EVENTS_INDEX_LIST = [ 0, 1, 2, 3, 4 ];
  const DEFAULT_DISAPPEARANCE_MILLISECONDS = 15000;

  // Internal variables
  let transmitters = {};
  let eventCallbacks = [ [], [], [], [], [] ];
  let disappearanceMilliseconds = DEFAULT_DISAPPEARANCE_MILLISECONDS;
  let purgeTimeout = null;

  // Get the given raddec's transmitter signature
  function getTransmitterSignature(raddec) {
    return raddec.transmitterId + SIGNATURE_SEPARATOR +
           raddec.transmitterIdType;
  }

  // Handle the given raddec
  function handleRaddec(raddec) {
    let transmitterSignature = getTransmitterSignature(raddec);
    let isNewTransmitter = !transmitters.hasOwnProperty(transmitterSignature);

    raddec.timestamp = raddec.timestamp || new Date().getTime();
    raddec.packets = raddec.packets || [];
    raddec.events = raddec.events || [ 3 ];

    if(isNewTransmitter) {
      transmitters[transmitterSignature] = {};
    }
    transmitters[transmitterSignature].raddec = raddec;
    handleEventCallbacks(raddec);
  }

  // Handle each registered callback once for the given raddec/event(s)
  function handleEventCallbacks(raddec) {
    let completedCallbacks = [];

    eventCallbacks.forEach(function(callbacks, eventIndex) {
      if(raddec.events.includes(eventIndex)) {
        callbacks.forEach(function(callback) {
          if(callback && (!completedCallbacks.includes(callback))) {
            callback(raddec);
          }
        });
      }
    });
  }

  // Purge any stale transmitters as disappearances
  function purgeDisappearances() {
    let currentTime = new Date().getTime();
    let nextPurgeTime = currentTime + disappearanceMilliseconds;
    for(transmitterSignature in transmitters) {
      let raddec = transmitters[transmitterSignature].raddec;
      let stalenessMilliseconds = currentTime - raddec.timestamp;
      if(stalenessMilliseconds > disappearanceMilliseconds) {
        raddec.events = [ 4 ];
        handleEventCallbacks(raddec);
        delete transmitters[transmitterSignature]; // TODO: delete only raddec?
      }
      else {
        let purgeTime = raddec.timestamp + disappearanceMilliseconds;
        if(purgeTime < nextPurgeTime) {
          nextPurgeTime = purgeTime;
        }
      }
    }
    let timeoutMilliseconds = Math.max(nextPurgeTime - currentTime, 10);
    purgeTimeout = setTimeout(purgeDisappearances, timeoutMilliseconds);
  }

  // Listen on the given WebSocket
  let listen = function(socket, printStatus) {
    printStatus = printStatus || false;

    socket.on('raddec', handleRaddec);

    if(printStatus) {
      socket.on('connect', function() {
        console.log('beaver connected to socket');
      });
      socket.on('disconnect', function(message) {
        console.log('beaver disconnected from socket:', message);
      });
    }

    if(!purgeTimeout) {
      purgeDisappearances();
    }
  };

  // Register a callback for the given event type(s)
  let setEventCallback = function(events, callback) {
    if(!(callback && (typeof callback === 'function'))) { 
      return;
    }
    if(!Array.isArray(events)) {
      events = ALL_EVENTS_INDEX_LIST;
    }
    events.forEach(function(event) {
      if(ALL_EVENTS_INDEX_LIST.includes(event)) {
        eventCallbacks[event].push(callback);
      }
    });
  }

  // Expose the following functions and variables
  return {
    listen: listen,
    on: setEventCallback,
    transmitters: transmitters
  }

}());
