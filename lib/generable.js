/**
 * Copyright reelyActive 2017-2019
 * We believe in an open Internet of Things
 */


const http = require('http');
const dgram = require('dgram');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const socketio = require('socket.io');
const Barnowl = require('barnowl');
const BarnowlReel = require('barnowl-reel');
const Raddec = require('raddec');


const PORT = process.env.PORT || 3001;
const REEL_PORT = process.env.REEL_PORT || 50000;
const RADDEC_PORT = process.env.RADDEC_PORT || 50001;


/**
 * GeneraBLE Class
 * Generative art from ambient wireless packet traffic.
 */
class GeneraBLE {

  /**
   * GeneraBLE constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    this.app = express();
    this.server = http.createServer(this.app);
    this.router = express.Router();
    this.app.use(bodyParser.json());
    this.app.use(function(req, res, next) {
      req.generable = self;
      next();
    });
    this.app.use('/', express.static(path.resolve(__dirname + '/../web')));
    this.app.use('/', this.router);

    this.io = socketio(this.server);

    this.udpServer = dgram.createSocket('udp4');
    this.udpServer.bind(RADDEC_PORT, '0.0.0.0');

    this.barnowl = new Barnowl(options.barnowl);
    this.barnowl.addListener(BarnowlReel, {}, BarnowlReel.UdpListener,
                             { path: '0.0.0.0:' + REEL_PORT });

    this.barnowl.on('raddec', function(raddec) {
      self.io.emit('raddec', raddec);
    });

    this.udpServer.on('message', function(msg) {
      try {
        let raddec = new Raddec(msg);

        if(raddec !== null) {
          self.io.emit('raddec', raddec);
        }
      }
      catch(error) {};
    });

    this.server.listen(PORT, function() {
      console.log('GeneraBLE is listening on port', PORT);
    });
  }

}


module.exports = GeneraBLE;


