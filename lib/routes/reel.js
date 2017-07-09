/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const express = require('express');
const path = require('path');


var router = express.Router();

router.route('/')
  .get(function(req, res) {
    retrieveReel(req, res);
  });


/**
 * Retrieve the reel settings and state.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function retrieveReel(req, res) {

  switch(req.accepts(['json', 'html'])) {
    case 'html':
      res.sendFile(path.resolve(__dirname + '/../../web/reel.html'));
      break;
    default:
      req.reelCtrl.getState(function(response) {
        res.json(response);
      });
      break;
  }
}

module.exports = router;
