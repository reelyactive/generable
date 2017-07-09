/**
 * Copyright reelyActive 2017
 * We believe in an open Internet of Things
 */

const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const nedb = require('nedb');
const hueCtrl = require('./hueCtrl');
const midiCtrl = require('./midiCtrl');
const oscCtrl = require('./oscCtrl');
const reelCtrl = require('./reelCtrl');
const generator = require('./generator');


const HTTP_PORT = 80;
const DB_FILE = 'data/generable.db';


/**
 * GeneraBLE Class
 * Generative art from ambient BLE advertisement packets.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
function GeneraBLE(options) {
  var self = this;

  options = options || {};
  self.httpPort = options.httpPort || HTTP_PORT;

  self.app = express();
  self.server = http.createServer(self.app);
  self.app.use(bodyParser.json());
  self.app.use(cors());

  self.db = new nedb({ filename: DB_FILE, autoload: true });

  self.hue = new hueCtrl( { db: self.db } );
  self.midi = new midiCtrl( { db: self.db } );
  self.osc = new oscCtrl( { db: self.db } );
  self.reel = new reelCtrl( { db: self.db } );

  self.reel.on('visibilityEvent', function(event) {
    generator.handleGenerativeEvent(event, self.hue, self.midi, self.osc);
  });

  self.app.use(function(req, res, next) {
    req.hueCtrl = self.hue;
    req.midiCtrl = self.midi;
    req.oscCtrl = self.osc;
    req.reelCtrl = self.reel;
    next();
  });
  
  self.router = express.Router();

  self.app.use('/', express.static(path.resolve(__dirname + '/../web')));
  self.app.use('/', self.router);
  self.app.use('/hue', require('./routes/hue.js'));
  self.app.use('/midi', require('./routes/midi.js'));
  self.app.use('/osc', require('./routes/osc.js'));
  self.app.use('/reel', require('./routes/reel.js'));

  self.server.listen(self.httpPort, function() {
    console.log("GeneraBLE is listening on port " + self.httpPort);
  });
}

module.exports = GeneraBLE;
