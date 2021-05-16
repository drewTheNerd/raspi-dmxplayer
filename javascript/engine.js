// Raspi DMX Player
// engine.js
// by Drew Shipps


/* ================================================= */
/*  IMPORT                                           */
/* ================================================= */
const VERSION = require('./version');
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

const sun = require('sun-time');



/* ================================================= */
/*  INIT                                             */
/* ================================================= */
console.log(colors.yellow("Launching Raspi DMX Player Engine..."));

var intervalIDcounter = 1;
var allSchedulers;
var showInterval = [];
var schedulerJobs = [];
var cancelSchedulerJobs = [];

var currentlyPlayingShow = "none";
var currentScheduler = null;

var coordinates = [0, 0];
readCoordinates();



/* ================================================= */
/*  AUX FUNCTIONS                                    */
/* ================================================= */
function readSchedulersJSON() {
	console.log(colors.cyan("ENGINE: Reading schedulers..."));
	fs.readFile('./config/schedulers.json', function(err, data) {
		allSchedulers = JSON.parse(String(data));
	});
}

function resetAllChannels() {
	for (var r = 1; r < 256; r++) {
		universe.update({[r]: 0});
	}
}


function readCoordinates() {
	console.log(colors.gray("ENGINE: Reading coordinates..."));
	fs.readFile('./config/coordinates.json', function(err, data) {
		coordinates = JSON.parse(String(data));
		console.log(colors.gray(sun(parseFloat(coordinates[0]), parseFloat(coordinates[1]))));
	});
}



/* ================================================= */
/*  ENGINE FUNCTIONS                                 */
/* ================================================= */
function activateScheduler(scheduler) {
	console.log(colors.blue("ENGINE: Activating scheduler \"" + scheduler.name + "\""));

	const thisIntervalID = intervalIDcounter;
	intervalIDcounter++;

	var show;
	fs.readFile('./shows/' + scheduler.showFileName, function(err, data) {
		if (err) {
			if (err.errno == -2) {
				console.log(colors.error("ENGINE ERROR: Scheduler contains reference to non existent show (" + scheduler.name + ")"));
				return;
			}
		}

		show = JSON.parse(String(data));
		show.frames = JSON.parse(show.frames);


		var startHour = scheduler.startTime.substring(0, 2);
		var startMinute = scheduler.startTime.substring(3, 5);
		if (scheduler.startTime == "sunrise") {
			var sunrise = sun(parseFloat(coordinates[0]), parseFloat(coordinates[1])).rise;
			startHour = sunrise.substring(0, 2);
			startMinute = sunrise.substring(3, 5);
		} else if (scheduler.startTime == "sunset") {
			var sunset = sun(parseFloat(coordinates[0]), parseFloat(coordinates[1])).set;
			startHour = sunset.substring(0, 2);
			startMinute = sunset.substring(3, 5);
		}

		var endHour = scheduler.endTime.substring(0, 2);
		var endMinute = scheduler.endTime.substring(3, 5);
		if (scheduler.endTime == "sunrise") {
			var sunrise = sun(parseFloat(coordinates[0]), parseFloat(coordinates[1])).rise;
			endHour = sunrise.substring(0, 2);
			endMinute = sunrise.substring(3, 5);
		} else if (scheduler.endTime == "sunset") {
			var sunset = sun(parseFloat(coordinates[0]), parseFloat(coordinates[1])).set;
			endHour = sunset.substring(0, 2);
			endMinute = sunset.substring(3, 5);
		}



		var dayOfWeek = '*';
		var month = '*';
		var dayOfMonth = '*';
		if (scheduler.frequency == 'Daily') {
			if (scheduler.frequencyRepeat == 0) {
				dayOfMonth = '*';
			} else {
				dayOfMonth = '*/' + scheduler.frequencyRepeat;
			}
		} else if (scheduler.frequency == 'Weekly') {
			dayOfWeek = scheduler.frequencyRepeat;
		} else if (scheduler.frequency == 'One-Time') {
			// COME BACK TO THIS FOR CALCULATING YEAR - maybe use if currentYear != schedulerRepeat.year return
			month = scheduler.frequencyRepeat.substring(8, 10);
			dayOfMonth = scheduler.frequencyRepeat.substring(5, 7);
		}


		var today = new Date();
		var currentDayOfWeek = String(today.getDay());
		var currentMonth = String(today.getMonth() + 1).padStart(2, '0');;
		var currentDayOfMonth = String(today.getDate()).padStart(2, '0');


		if (dayOfWeek == '*' || dayOfWeek.includes(currentDayOfWeek) || (month == currentMonth && dayOfMonth == currentDayOfMonth)) {
			var currentTimeInMinutes = (today.getHours()*60) + today.getMinutes();
			var startTimeInMinutes = parseInt((startHour*60)) + parseInt(startMinute);
			var endTimeInMinutes = parseInt((endHour*60)) + parseInt(endMinute);

			if (startTimeInMinutes < currentTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
				console.log(colors.yellow('ENGINE: Resuming show "' + show.name + '" (scheduler "' + scheduler.name + '")'));
			    currentlyPlayingShow = show.name;
			    currentScheduler = scheduler;

				var currentFrame = 0;
			    showInterval[thisIntervalID] = setInterval(function() {
			        for (var i = 0; i < show.frames[currentFrame].length; i++) {
			            var ch = i + 1;
			            var val = show.frames[currentFrame][i];
			            universe.update({[ch]: val});
			        }

			        if (currentFrame < show.frames.length-1) currentFrame++;
			        else currentFrame = 0;
			    }, show.delayMS);
			}
		} else {
			var startDateString = startMinute + ' ' + startHour + ' ' + dayOfMonth + ' ' + month + ' ' + dayOfWeek;
			//console.log(colors.data("Start date:     " + startDateString));

		    schedulerJobs[thisIntervalID] = schedule.scheduleJob(startDateString, function(){
				console.log(colors.yellow('ENGINE: Playing show "' + show.name + '" (scheduler "' + scheduler.name + '")'));
			    currentlyPlayingShow = show.name;
			    currentScheduler = scheduler;

				var currentFrame = 0;
			    showInterval[thisIntervalID] = setInterval(function() {
			        for (var i = 0; i < show.frames[currentFrame].length; i++) {
			            var ch = i + 1;
			            var val = show.frames[currentFrame][i];
			            universe.update({[ch]: val});
			        }

			        if (currentFrame < show.frames.length-1) currentFrame++;
			        else currentFrame = 0;
			    }, show.delayMS);
		    });
		}




	    var endTimeMinute = parseInt(endMinute);
	    var endTimeHour = parseInt(endHour);
	    if (endTimeMinute == -1) {
	    	endTimeHour--;
	    	endTimeMinute = 59;
	    }
		if (endTimeHour < 10) endTimeHour = '0' + endTimeHour

	    var endDateString = '59 ' + endTimeMinute + ' ' + endTimeHour + ' ' + dayOfMonth + ' ' + month + ' ' + dayOfWeek;
		//console.log(colors.data("End date:    " + endDateString));

	    cancelSchedulerJobs[thisIntervalID] = schedule.scheduleJob(endDateString, function() {
		    console.log(colors.yellow('ENGINE: Stopping show ' + scheduler.name));
	        clearInterval(showInterval[thisIntervalID]);
	        resetAllChannels();
			currentlyPlayingShow = "none";
			currentScheduler = null;
	    }); 
	});
}




/* ================================================= */
/*  EXPORT FUNCTIONS                                 */
/* ================================================= */
module.exports = {
	activateEngine: function () {
		console.log(colors.yellow("ENGINE: Activating engine..."));
		readSchedulersJSON();

		setTimeout(function(){ 
			for (var i = 0; i < allSchedulers.schedulers.length; i++) {
				activateScheduler(allSchedulers.schedulers[i]);
			}
		}, 200);
	},

	refreshEngine: function () {
		console.log(colors.yellow("ENGINE: Refreshing engine..."));

		for (var c = 0; c < schedulerJobs.length; c++) {
			if (schedulerJobs[c] != undefined) {
				schedulerJobs[c].cancel();
			}
			if (cancelSchedulerJobs[c] != undefined) {
				cancelSchedulerJobs[c].cancel();
			}
		}
		for (var c = 0; c < showInterval.length; c++) {
			clearInterval(showInterval[c]);
		}
        resetAllChannels();

		readSchedulersJSON();
		
		setTimeout(function(){ 
			for (var i = 0; i < allSchedulers.schedulers.length; i++) {
				activateScheduler(allSchedulers.schedulers[i]);
			}
		}, 200);
	},

	getCurrentlyPlayingShow: function () {
		return currentlyPlayingShow;
	},

	getCurrentSchedulerName: function () {
		if (currentScheduler != null) {
			return currentScheduler.name;
		} else {
			return "";
		}
	},

	getCurrentSchedulerEndTime: function () {
		if (currentScheduler != null) {
			return currentScheduler.endTime;
		} else {
			return "";
		}
	},

	outputDMX: function (ch, val) {
		//console.log(colors.yellow("ENGINE: Outputting DMX: " + ch + ", " + val));
	    universe.update({[ch]: val});
	}
};








