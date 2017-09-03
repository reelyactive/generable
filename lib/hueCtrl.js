/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const hue = require('node-hue-api');


const BRIDGE_ID = 'bridge';
const BRIDGE_SEARCH_MILLISECONDS = 8000;


/**
 * HueCtrl Class
 * Controller for Philips Hue lights.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function HueCtrl(options) {
  var self = this;

  options = options || {};
  self.db = options.db;
  self.io = options.io;

  self.lights = {};
  loadBridge(self);
}


/**
 * Get the detected Hue bridges as an array of bridge IP address with status.
 * @param {callback} callback Function to call on completion.
 */
HueCtrl.prototype.getBridges = function(callback) {
  var self = this;
  var list = [];

  // upnpSearch searches on the local network (Internet not required)
  hue.upnpSearch(BRIDGE_SEARCH_MILLISECONDS)
    .then(function(bridges) {
      for(var cBridge = 0; cBridge < bridges.length; cBridge++) {
        var isConnected = (bridges[cBridge].ipaddress === self.bridge.ip);
        list.push({ ip: bridges[cBridge].ipaddress, connected: isConnected });
      }
      callback(list);
    })
    .done();
}


/**
 * Connect to the bridge on the specified IP address.
 * @param {String} ip The IP address of the bridge.
 * @param {callback} callback Function to call on completion.
 */
HueCtrl.prototype.connectToBridge = function(ip, callback) {
  var self = this;

  self.hue.registerUser(ip, 'generable')
    .then(function(username) {
      updateBridge(self, ip, username, function() {
        self.getBridges(function(bridges) {
          return callback(bridges);
        });
      });
    })
    .fail(function(err) {
      self.getBridges(function(bridges) {
        return callback(bridges);
      });
    })
    .done();
}


/**
 * Get the lights of the connected Hue bridge as an array.
 * @param {callback} callback Function to call on completion.
 */
HueCtrl.prototype.getLights = function(callback) {
  var self = this;

  self.hue.lights()
    .then(function(lights) {
      self.lights = {};
      for(var cLight = 0; cLight < lights.lights.length; cLight++) {
        var light = lights.lights[cLight];
        if(light.state.reachable) {
          self.lights[light.id] = { idle: true };
        }
      }
      return callback(lights.lights);
    })
    .fail(function(err) {
      console.log('fail', err);
      self.lights = {};
      return callback([]);
    })
    .done();
};


/**
 * Get the IDs of all reachable lights and return as an array.
 * @param {callback} callback Function to call on completion.
 */
HueCtrl.prototype.getLightIDs = function(callback) {
  var self = this;
  return Object.keys(self.lights);
};


/**
 * Set the state of the given light.
 * @param {Number} id The id of the light.
 * @param {Object} object The desired state of the light
 */
HueCtrl.prototype.setLightState = function(id, state) {
  var self = this;

  var makeIdle = function() {
    self.lights[id].idle = true;
  }

  var handleError = function(err) {
    self.lights[id].idle = true;
    var data = { message: err.message, address: err.address };
    self.io.emit('hue', { type: 'error', data: data });
    console.log('Hue error:', err.message);
  }

  if(self.isConnected && self.lights.hasOwnProperty(id) &&
     (self.lights[id].idle === true)) {
    self.lights[id].idle = false;
    var lightState = hue.lightState.create().hue(state.hue)
                                            .bri(state.bri)
                                            .sat(state.sat)
                                            .transition(state.transition || 0);
    self.hue.setLightState(id, lightState.on())
            .then(makeIdle)
            .fail(handleError)
            .done();
    self.io.emit('hue', { type: 'state', data: { id: id, state: state } });
  }
};


/**
 * Load the bridge credentials from the database.
 * @param {HueCtrl} instance The HueCtrl instance.
 */
function loadBridge(instance) {
  instance.bridge = {};
  instance.isConnected = false;

  instance.db.findOne({ _id: BRIDGE_ID }, function (err, doc) {
    if(doc) {
      instance.bridge = { ip: doc.ip, username: doc.username };
      instance.hue = new hue.HueApi(doc.ip, doc.username);
      instance.isConnected = true;
      instance.getLights(function(lights) {
        console.log('Hue bridge connected with', instance.getLightIDs().length,
                    'reachable lights');
      });
    }
    else {
      instance.hue = new hue.HueApi();
    }
  });
}


/**
 * Update the bridge credentials in the database.
 * @param {HueCtrl} instance The HueCtrl instance.
 * @param {String} ip The IP address of the bridge.
 * @param {String} username The username of the bridge.
 * @param {callback} callback Function to call on completion.
 */
function updateBridge(instance, ip, username, callback) {
  instance.bridge = { ip: ip, username: username };
  instance.hue = new hue.HueApi(ip, username);
  instance.isConnected = true;
  instance.getLights(function(lights) {
    console.log('Hue bridge connected with', instance.getLightIDs().length,
                'reachable lights');
  });

  instance.db.update({ _id: BRIDGE_ID },
                     { _id: BRIDGE_ID, ip: ip, username: username },
                     { upsert: true }, function() {
    console.log('Hue bridge updated to ' + ip +
                ' having username ' + username);
    return callback();
  });
}

module.exports = HueCtrl;
