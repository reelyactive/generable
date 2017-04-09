/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

var hue = require('node-hue-api');


var BRIDGE_ID = 'bridge';


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
  hue.upnpSearch()
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
      return callback(lights.lights);
    })
    .catch(function(err) {
      return callback({});
    });
}


/**
 * Load the bridge credentials from the database.
 * @param {HueCtrl} instance The HueCtrl instance.
 */
function loadBridge(instance) {
  instance.bridge = {};

  instance.db.findOne({ _id: BRIDGE_ID }, function (err, doc) {
    if(doc) {
      instance.bridge = { ip: doc.ip, username: doc.username };
      instance.hue = new hue.HueApi(doc.ip, doc.username);
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

  instance.db.update({ _id: BRIDGE_ID },
                     { _id: BRIDGE_ID, ip: ip, username: username },
                     { upsert: true }, function() {
    console.log('Hue bridge updated to ' + ip +
                ' having username ' + username);
    return callback();
  });
}

module.exports = HueCtrl;