/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

var express = require('express');
var path = require('path');


var router = express.Router();

router.route('/')
  .get(function(req, res) {
    retrieveMidi(req, res);
  });

router.route('/interfaces/')
  .get(function(req, res) {
    retrieveInterfaces(req, res);
  })
  .put(function(req, res) {
    replaceInterfaces(req, res);
  });


/**
 * Retrieve the midi settings and state.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveMidi(req, res) {
  res.sendFile(path.resolve(__dirname + '/../../web/midi.html'));
}

/**
 * Get the interfaces.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveInterfaces(req, res) {
  req.midiCtrl.getInterfaces(function(response) {
    res.json(response);
  });
}

/**
 * Replace the interfaces.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function replaceInterfaces(req, res) {
  req.midiCtrl.selectInterface(req.body.index, function(response) {
    res.json(response);
  });
}

module.exports = router;
