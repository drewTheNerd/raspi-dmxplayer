# raspi-dmxplayer
Raspi DMX Player is an Node.JS app designed to play back DMX shows, controllable via a web interface. The final result will be a Raspberry Pi based device with optional cellular connectivity and up to 2 universes of DMX output, controllable by loggin in via RealVNC and opening up `localhost:8080/index.html`. Raspi DMX Player is written by and copyright of Drew Shipps.


# Version History
## Version 0.1.0 
- initial rewrite after data loss. 
- basic functions for dmx and http web server

## Version 0.1.1 
- node webserver.js http server. serves html and css pages for site
- styling of header and simple cards on home screen
- shows page loads show name using fs (file system)
- scheduler page has button that sends data back to server via websocket
- channels page has 4 channels with sliders and text input. sends setDMX(ch, val) on slider or number change (via websocket)

## Version 0.1.2
**Channels Page**
- added `dmx-channels-save.txt` to root
- added automatic restoration of previous channel state on load
- added reset all channels button

**Shows Page**
- added show-editor HTML page
- added renaming functionality for shows page
- added direct show editing functionality on show-editor page

## Version 0.1.3
**Shows Page**
- changed show format to JSON
- rebuilt show renaming functionality
- rebuilt show editing functionality
- added show deletion functionality
- added new show functionality

**Scheduler**
- added temporary play and stop buttons for shows (*note NaN bug*)

## Version 0.1.4
- added schedulers.JSON file to hold all scheduler objects
- added new and delete buttons to scheduler page
- added scheduler editor feature

## Version 0.2.0
- created engine
- added resume show on engine start feature
- added status info to home page

## Version 0.2.1
- Added sunrise and sunset options for scheduler start/end times
- tested show recording and decided on making a separate nodeJS app for that
