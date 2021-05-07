const DMX = require('dmx');

const dmx = new DMX();

var universe = dmx.addUniverse('demo', 'enttec-open-usb-dmx', '/dev/ttyUSB0');

universe.update({1: 255, 2: 255, 3: 255, 4: 255});