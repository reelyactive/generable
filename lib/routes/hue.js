/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

var express = require('express');
var path = require('path');


var router = express.Router();

router.route('/')
  .get(function(req, res) {
    retrieveHue(req, res);
  });


/**
 * Retrieve the hue settings and state.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveHue(req, res) {

  switch(req.accepts(['json', 'html'])) {
    case 'html':
      res.sendFile(path.resolve(__dirname + '/../../web/hue.html'));
      break;
    default:
      req.hueCtrl.getState(function(response) {
        res.json(response);
      });
      break;
  }
}

module.exports = router;
