GeneraBLE
=========

Generative art from ambient BLE advertisement packets.  A work in progress started on #IoTDay 2017 based on our earlier work with [midiot](https://www.npmjs.com/package/midiot) and with Philips Hue.

For instructions on how to prepare a Raspberry Pi to run GeneraBLE, see our [Experience Generative Art tutorial](https://reelyactive.github.io/experience-generative-art.html).


System Overview
---------------

![System Overview Graphic](https://reelyactive.github.io/generable/images/system-overview.png)


OSC Interface
-------------

![OSC Message Graphic](https://reelyactive.github.io/generable/images/osc-messages.png)


MIDI Interface
--------------

The [midi package prerequisites](https://www.npmjs.com/package/midi#prerequisites) must be met before installation.

### Raspberry Pi (and other Linux-based systems)

ALSA is likely to be the only missing prerequisite, and can be installed as follows:

    sudo apt-get install libasound2-dev

![MIDI Message Graphic](https://reelyactive.github.io/generable/images/midi-messages.png)


Installation
------------

From the command line, browse to the folder which will contain your project and run.

    npm install generable


Hello GeneraBLE!
----------------

In the folder where you installed generable (see above), create a file called generable.js and paste the following contents:

```javascript
var generable = require('generable');
var app = new generable( { httpPort: 3000 } );
```

From the command line, in the folder which contains your project, run the following:

    node generable.js

Point your favourite web browser to [localhost:3000](http://localhost:3000).


Configuration
-------------

The intent of the GeneraBLE project is for all configuration to be completed through human-friendly web interfaces.  The configuration interfaces are still a work in progress, however.

To reset the configuration to default, simply delete the data/generable.db file and restart the program.


License
-------

MIT License

Copyright (c) 2017 reelyActive

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
