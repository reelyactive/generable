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


/**
 * Retrieve the midi settings and state.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveMidi(req, res) {

  switch(req.accepts(['json', 'html'])) {
    case 'html':
      res.sendFile(path.resolve(__dirname + '/../../web/midi.html'));
      break;
    default:
      req.midiCtrl.getState(function(response) {
        res.json(response);
      });
      break;
  }
}

module.exports = router;
