// Raspi DMX Player
// engine.js
// by Drew Shipps


/* ================================================= */
/*  IMPORT                                           */
/* ================================================= */
const VERSION = require('./_version');
const colors = require('colors');

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

const fs = require('fs');
const schedule = require('node-schedule');

const DMX = require('dmx');
const dmx = new DMX();
var universe = dmx.addUniverse('universe1', 'enttec-open-usb-dmx', '/dev/cu.usbserial-AH06H3UD'); // /dev/ttyUSB0 on raspi



/* ================================================= */
/*  INIT                                             */
/* ================================================= */
console.log("Launching Raspi DMX Player ENGINE...".info);






// code
var job1Interval;

var scheduler1 = {
  	name: "Day Show",
  	showName: "RGB Basic",
  	showFileName: "show001.json",
  	frequency: "Daily",
  	frequencyRepeat: 2,
  	startTime: "21:58",
  	endTime: "21:59"
};



var show1;
fs.readFile('./shows/show001.json', function(err, data) {
	show1 = JSON.parse(String(data));
	show1.frames = JSON.parse(show1.frames);
});







const job1 = schedule.scheduleJob(scheduler1.startTime.substring(3, 5) + ' ' + scheduler1.startTime.substring(0, 2) + ' * * *', function(){
  console.log('playing show');

  var currentFrame = 0;

  job1Interval = setInterval(function() {
  	for (var i = 0; i < show1.frames[currentFrame].length; i++) {
		var ch = i + 1;
		var val = show1.frames[currentFrame][i];
		//console.log("Set channel " + ch + " to value " + val);
		universe.update({[ch]: val});
	}

	if (currentFrame < show1.frames.length-1) currentFrame++;
	else currentFrame = 0;


  }, show1.delayMS);

});





const cancelJob1 = schedule.scheduleJob('55 ' + parseInt(scheduler1.endTime.substring(3, 5)-1) + ' ' + scheduler1.endTime.substring(0, 2) + ' * * *', function(){
  clearInterval(job1Interval);
});























































