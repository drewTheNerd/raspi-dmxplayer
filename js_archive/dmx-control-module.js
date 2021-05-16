(function(exports) {
   
    // Helper function
    function toLC(str) {
        return str.trim().toLowerCase();
    }
   
    // Function to be exposed
    function setChannel(ch, val) {
        const DMX = require('dmx');
        const dmx = new DMX();
        var universe = dmx.addUniverse('demo', 'enttec-open-usb-dmx', '/dev/ttyUSB0');

        universe.update({ch: val});
        return "set channel " + ch + " to " + val
    }
   
    // Export the function to exports
    // In node.js this will be exports 
    // the module.exports
    // In browser this will be function in
    // the global object sharedModule
    exports.setChannel = setChannel;
       
})(typeof exports === 'undefined'? 
            this['sharedModule']={}: exports);