/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

var barnowl = require('barnowl');
var barnacles = require('barnacles');
var Barnacles = barnacles.Barnacles;


/**
 * ReelCtrl Class
 * Controller for reel interface.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function ReelCtrl(options) {
  var self = this;

  options = options || {};

  self.middleware = new barnowl(options.barnowl);
  self.notifications = new Barnacles(options.barnacles);
  self.notifications.configureRoutes( { app: options.app } );
  self.notifications.createWebSocket( { server: options.server } );
}


/**
 * Get the current state.
 * @param {callback} callback Function to call on completion.
 */
ReelCtrl.prototype.getState = function(callback) {
  var self = this;

  callback({});
}

module.exports = ReelCtrl;
