// version.js
// This file contains the current version of Raspi DMX Player, as well as the version history
// Raspi DMX Player is written by Drew Shipps. Copyright Drew Shipps 2021.


// VERSION HISTORY
// Version 0.1.0 - initial rewrite after data loss. 
// 				 - basic functions for dmx and http web server

// Version 0.1.1 - node webserver.js http server. serves html and css pages for site
// 				 - styling of header and simple cards on home screen
// 				 - shows page loads show name using fs (file system)
// 				 - scheduler page has button that sends data back to server via websocket
// 				 - channels page has 4 channels with sliders and text input. sends setDMX(ch, val)
// 				   on slider or number change (via websocket)

// Version 0.1.2 - CURRENT EDITING VERSION
// 				 - 


module.exports = {
  version: function () {
    return "0.1.1"
  }
};