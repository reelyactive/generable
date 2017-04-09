/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

var hue = require('node-hue-api');


/**
 * HueCtrl Class
 * Controller for Philips Hue lights.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function HueCtrl(options) {
  var self = this;

  options = options || {};

  self.bridge = {};
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
 * Get the current state.
 * @param {callback} callback Function to call on completion.
 */
HueCtrl.prototype.getState = function(callback) {
  var self = this;

  self.getBridges(function(list) {
    callback(list); // TODO: make this the complete state
  });
}

module.exports = HueCtrl;
