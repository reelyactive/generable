/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const express = require('express');
const path = require('path');


var router = express.Router();

router.route('/')
  .get(function(req, res) {
    retrieveOsc(req, res);
  });

router.route('/interfaces/')
  .get(function(req, res) {
    retrieveInterfaces(req, res);
  })
  .put(function(req, res) {
    replaceInterfaces(req, res);
  });


/**
 * Retrieve the OSC settings and state.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveOsc(req, res) {
  res.sendFile(path.resolve(__dirname + '/../../web/osc.html'));
}

/**
 * Get the interfaces.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveInterfaces(req, res) {
  req.oscCtrl.getInterfaces(function(response) {
    res.json(response);
  });
}

/**
 * Replace the interfaces.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function replaceInterfaces(req, res) {
  req.oscCtrl.selectInterface(req.body.localInterface,
                              req.body.targetInterface, function(response) {
    res.json(response);
  });
}

module.exports = router;
