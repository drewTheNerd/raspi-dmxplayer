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
console.log(colors.yellow("Launching Raspi DMX Player Engine..."));

var intervalIDcounter = 1;
var allSchedulers;
var showInterval = [];
var schedulerJobs = [];
var cancelSchedulerJobs = [];

var currentlyPlayingShow = "none";
var currentScheduler = null;



/* ================================================= */
/*  AUX FUNCTIONS                                    */
/* ================================================= */
function readSchedulersJSON() {
	console.log(colors.cyan("ENGINE: Reading schedulers..."));
	fs.readFile('./schedulers.JSON', function(err, data) {
		allSchedulers = JSON.parse(String(data));
	});
}

function resetAllChannels() {
	for (var r = 1; r < 256; r++) {
		universe.update({[r]: 0});
	}
}



/* ================================================= */
/*  ENGINE FUNCTIONS                                 */
/* ================================================= */
function activateScheduler(scheduler) {
	console.log(colors.cyan("ENGINE: Activating scheduler \"" + scheduler.name + "\""));

	const thisIntervalID = intervalIDcounter;
	intervalIDcounter++;

	var show;
	fs.readFile('./shows/' + scheduler.showFileName, function(err, data) {
		show = JSON.parse(String(data));
		show.frames = JSON.parse(show.frames);


		var dayOfWeek = '*';
		var month = '*';
		var dayOfMonth = '*';
		if (scheduler.frequency == 'Daily') {
			if (scheduler.frequencyRepeat == 0) {
				dayOfMonth = '*';
			} else {
				dayOfMonth = '*/' + scheduler.frequencyRepeat;
				// NOTE TO SELF - COME BACK TO THIS
			}
		} else if (scheduler.frequency == 'Weekly') {
			dayOfWeek = scheduler.frequencyRepeat;
		} else if (scheduler.frequency == 'One-Time') {
			// COME BACK TO THIS FOR CALCULATING YEAR
			month = scheduler.frequencyRepeat.substring(8, 10);
			dayOfMonth = scheduler.frequencyRepeat.substring(5, 7);
		}


		var today = new Date();
		var currentDayOfWeek = String(today.getDay());
		var currentMonth = String(today.getMonth() + 1).padStart(2, '0');;
		var currentDayOfMonth = String(today.getDate()).padStart(2, '0');


		if (dayOfWeek == '*' || dayOfWeek.includes(currentDayOfWeek) || (month == currentMonth && dayOfMonth == currentDayOfMonth)) {
			var currentTimeInMinutes = (today.getHours()*60) + today.getMinutes();
			var startTimeInMinutes = parseInt((scheduler.startTime.substring(0, 2)*60)) + parseInt(scheduler.startTime.substring(3, 5));
			var endTimeInMinutes = parseInt((scheduler.endTime.substring(0, 2)*60)) + parseInt(scheduler.endTime.substring(3, 5));

			if (startTimeInMinutes < currentTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
				console.log(colors.yellow('ENGINE: Resuming show ' + show.name));
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
			var startDateString = scheduler.startTime.substring(3, 5) + ' ' + scheduler.startTime.substring(0, 2) + ' ' + dayOfMonth + ' ' + month + ' ' + dayOfWeek;
			//console.log(colors.data("Start date:     " + startDateString));

		    schedulerJobs[thisIntervalID] = schedule.scheduleJob(startDateString, function(){
			    console.log(colors.yellow('ENGINE: Playing show ' + show.name));
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




	    var endTimeMinute = parseInt(scheduler.endTime.substring(3, 5)-1);
	    var endTimeHour = scheduler.endTime.substring(0, 2);
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
			schedulerJobs[c].cancel();
			cancelSchedulerJobs[c].cancel();
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































































