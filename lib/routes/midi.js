/**
 * Copyright reelyActive 2017-2018
 * We believe in an open Internet of Things
 */

const express = require('express');
const path = require('path');


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

router.route('/assignments/')
  .get(function(req, res) {
    retrieveAssignments(req, res);
  });

router.route('/assignments/:channel')
  .put(function(req, res) {
    replaceAssignment(req, res);
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

/**
 * Get the assignments.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveAssignments(req, res) {
  req.midiCtrl.getAssignments(function(response) {
    res.json(response);
  });
}


/**
 * Replace the assignment.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function replaceAssignment(req, res) {
  req.midiCtrl.setAssignment(req.params.channel, req.body.assignment,
                             function(response) {
    res.json(response);
  });
}

module.exports = router;
