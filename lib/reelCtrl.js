/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const util = require('util');
const events = require('events');
const reelib = require('reelib');
const barnowl = require('barnowl');
const barnacles = require('barnacles');
const Barnacles = barnacles.Barnacles;


/**
 * ReelCtrl Class
 * Controller for reel interface.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function ReelCtrl(options) {
  var self = this;

  options = options || {};

  self.middleware = new barnowl( { n: 3, enableMixing: true,
                                   mixingDelayMilliseconds: 240,
                                   minMixingDelayMilliseconds: 120 } );
  self.notifications = new Barnacles(options.barnacles);
  self.notifications.configureRoutes( { app: options.app } );
  self.notifications.createWebSocket( { server: options.server } );

  // TODO: make this web-selectable rather than hard-coded
  self.middleware.bind( { protocol: "serial", path: "auto" } );

  self.middleware.on('visibilityEvent', function(tiraid) {
    self.emit('visibilityEvent', reelib.tiraid.toFlattened(tiraid));
  });

  events.EventEmitter.call(self);
}
util.inherits(ReelCtrl, events.EventEmitter);


/**
 * Get the current state.
 * @param {callback} callback Function to call on completion.
 */
ReelCtrl.prototype.getState = function(callback) {
  var self = this;

  callback({});
}

module.exports = ReelCtrl;
