/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const express = require('express');
const path = require('path');


var router = express.Router();

router.route('/')
  .get(function(req, res) {
    retrieveZyn(req, res);
  });

router.route('/interfaces/')
  .get(function(req, res) {
    retrieveInterfaces(req, res);
  })
  .put(function(req, res) {
    replaceInterfaces(req, res);
  });

router.route('/patches/')
  .put(function(req, res) {
    replacePatches(req, res);
  });


/**
 * Retrieve the Zyn settings and state.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveZyn(req, res) {
  res.sendFile(path.resolve(__dirname + '/../../web/zyn.html'));
}

/**
 * Get the interfaces.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveInterfaces(req, res) {
  req.zynCtrl.getInterfaces(function(response) {
    res.json(response);
  });
}

/**
 * Replace the interfaces.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function replaceInterfaces(req, res) {
  req.zynCtrl.selectInterface(req.body.localInterface,
                              req.body.targetInterface, function(response) {
    res.json(response);
  });
}


/**
 * Replace the patches.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function replacePatches(req, res) {
  req.zynCtrl.setPatch(req.body.patch, function(response) {
    res.json(response);
  });
}

module.exports = router;
