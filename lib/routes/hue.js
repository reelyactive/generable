/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const express = require('express');
const path = require('path');


var router = express.Router();

router.route('/')
  .get(function(req, res) {
    retrieveHue(req, res);
  });

router.route('/bridges/')
  .get(function(req, res) {
    retrieveBridges(req, res);
  })
  .put(function(req, res) {
    replaceBridges(req, res);
  });

router.route('/lights/')
  .get(function(req, res) {
    retrieveLights(req, res);
  });


/**
 * Retrieve the hue settings and state.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveHue(req, res) {
  res.sendFile(path.resolve(__dirname + '/../../web/hue.html'));
}

/**
 * Get the bridges.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveBridges(req, res) {
  req.hueCtrl.getBridges(function(response) {
    res.json(response);
  });
}

/**
 * Replace the bridges connection.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function replaceBridges(req, res) {
  req.hueCtrl.connectToBridge(req.body.ip, function(response) {
    res.json(response);
  });
}

/**
 * Get the lights.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveLights(req, res) {
  req.hueCtrl.getLights(function(response) {
    res.json(response);
  });
}

module.exports = router;
