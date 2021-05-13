// Raspi DMX Player
// webserver.js
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

const http = require('http');
const fs = require('fs');

const WebSocketServer = require('ws').Server
const wss = new WebSocketServer({ port: 8081 });



/* ================================================= */
/*  INIT                                             */
/* ================================================= */
console.log("Raspi DMX Player".info);
console.log("Version ".info + VERSION.version().info);

const engine = require('./engine');
engine.activateEngine();



/* ================================================= */
/*  VARIABLES                                        */
/* ================================================= */
var nextShowToEdit;
var allSchedulers;

/*
// UN CORRUPT SCHEDULERS FILE
var allSchedulers = {
	schedulers: []
}

var newScheduler = {
  	name: "name",
  	showName: "showName",
  	showFileName: "showFileName",
  	frequency: "frequency",
  	frequencyRepeat: "frequencyRepeat",
  	startTime: "startTime",
  	endTime: "endTime"
}
allSchedulers.schedulers.push(newScheduler)

updateSchedulersJSON();

*/
readSchedulersJSON();


/* ================================================= */
/*  UTILITY                                          */
/* ================================================= */
function readTextFile(path) {
	fs.readFile(path, function(err, data) {
		return String(data);
	});
}

function addZeroes(number) {
	if (number < 10) {
		number = "00" + number;
	} else if (number < 100) {
		number = "0" + number;
	}
	return number;
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}


function createNewShow(showName, fileName, delayMS, data) {
	data = data.replace(/\n/g, '');
	var show = {
	  	name: showName,
	  	delayMS: delayMS,
	  	frames: data,
	  	addFrame : function(frameData) {
		  	this.frames[this.frames.length] = frameData;
		}
	};

	var fileData = JSON.stringify(show);
	fs.writeFile('./shows/' + fileName, fileData, err => {
	  	if (err) {
	    	console.error(err)
	    	return
	  	}
	})
}


function readSchedulersJSON() {
	console.log(colors.cyan("Reading schedulers..."));
	fs.readFile('./schedulers.JSON', function(err, data) {
		allSchedulers = JSON.parse(String(data));
	});
}

function updateSchedulersJSON() {
	var fileData = JSON.stringify(allSchedulers);
	fs.writeFile('./schedulers.JSON', fileData, err => {
	  	if (err) {
	    	console.error(err)
	    	return
	  	}
	})
	console.log(colors.cyan("Updated saved schedulers file."));
	engine.refreshEngine();
}

function addScheduler(name, showName, showFileName, frequency, frequencyRepeat, startTime, endTime) {
	var newScheduler = {
	  	name: name,
	  	showName: showName,
	  	showFileName: showFileName,
	  	frequency: frequency,
	  	frequencyRepeat: frequencyRepeat,
	  	startTime: startTime,
	  	endTime: endTime
	}
	allSchedulers.schedulers.push(newScheduler)
	console.log(colors.cyan("Created a new scheduler."));
	updateSchedulersJSON();
	engine.refreshEngine();
}

function returnObject(name, showName, showFileName, frequency, frequencyRepeat, startTime, endTime) {
	var object = {
	  	name: name,
	  	showName: showName,
	  	showFileName: showFileName,
	  	frequency: frequency,
	  	frequencyRepeat: frequencyRepeat,
	  	startTime: startTime,
	  	endTime: endTime
	}
	return object;
}

function deleteSchedulerAtIndex(index) {
	allSchedulers.schedulers.splice(index, 1);
	updateSchedulersJSON();
	engine.refreshEngine();
}





























/* ================================================= */
/*  HTTP SERVER                                      */
/* ================================================= */
http.createServer(function (req, res) {
	if (req.url.substring(0, 11) === '/socket.io/') {
		// do nothing because this is not stored on the local server
		console.log(colors.error("The requested URL does not exist on this server. (" + req.url + ")"));
	} else if (req.url === '/') {
  		// otherwise serve whatever file is asked for
		console.log("Serving index file");	

  		fs.readFile('./index.html', function(err, data) {
			res.writeHead(200);
			res.write(data);
			//console.log(String(data));
			res.end();
		});


	} else if (req.url === '/index.html') {

		console.log("Serving " + req.url);	

  		fs.readFile('.' + req.url, function(err, data) {
			res.writeHead(200, {'Content-Type': 'text/html'});
			var webpage = String(data).split('{{DATA}}');

			var result = webpage[0];
			result += `
			<div class="panel">
				<div class="card">
					<h3>Status:</h3>
					<p>Playing show <i>` + engine.getCurrentlyPlayingShow() + `</i></p>
				</div>
			</div>

			<div class="panel">
				<div class="card">
					<h3><a href="./html/scheduler.html" class="hiddenA">Schedule:</a></h3>
					<ul>
						<li>Active scheduler: <i>` + engine.getCurrentSchedulerName() + `</i> until ` 
						+ engine.getCurrentSchedulerEndTime() + `</li>
					</ul>
				</div>
			</div>

			<div class="panel">
				<div class="card">
					<h3><a href="./html/dmx-control.html" class="hiddenA">Manual Control:</a></h3>
					<p>Manual DMX channel control is currently <span class="bold">disabled.</span></p>
				</div>
			</div>`




			engine.getCurrentlyPlayingShow();
			result += webpage[1];

			res.write(result);
			res.end();
		});


	} else if (req.url === '/html/dmx-control.html') {

		console.log("Serving " + req.url);	

  		fs.readFile('.' + req.url, function(err, data) {
			res.writeHead(200, {'Content-Type': 'text/html'});
			var webpage = String(data).split('{{DATA}}');

			var result = webpage[0];
			for (var i = 2; i < 513; i++) {
				result += '<p>' + i 
				+ '. <input type="range" min="0" max="255" value="0" class="channel-slider" id="channel-slider-' + i 
				+ '" onchange="channelSliderChange(' + i 
				+ ');"><input type="number" min="0" max="255" maxlength="3" id="channel-number-' + i 
				+ '" onchange="channelNumberChange(' + i 
				+ ')"></p>';
			}
			result += webpage[1];

			res.write(result);
			res.end();
		});


	} else if (req.url === '/html/shows.html') {
		console.log("Serving " + req.url);	
		var showsTable = [];
		var i = 0;

		let filenames = fs.readdirSync("./shows/");
  
		filenames.forEach((file) => {
			fs.readFile('./shows/' + file, function(err, data) {
				if (file[0] != '.') {

					var thisShow = JSON.parse(String(data));
					var row = '<tr><td>'
					+ thisShow.name + '<a href="../html/shows.html" class="Show_ActionButton Show_ActionButton_Right" onclick="renameShow(\'' 
					+ file + '\',\'' + thisShow.name + '\')"><i class="fas fa-pen"></i></a></td><td>'
					+ file + '</td><td><a href="../html/show-editor.html?fileName='
					+ file + '" class="Show_ActionButton"><i class="fas fa-edit"></i></a>'
					+ '<a href="../html/shows.html" class="Show_ActionButton redbutton" onclick="deleteShow(\''
					+ file + '\')"><i class="fas fa-trash-alt"></i></a></td></tr>';
					showsTable.push([parseInt(file.substring(5, 8)), row]);
				}
				i++;
			});
		});

		setTimeout(function(){
	  		fs.readFile('.' + req.url, function(err, data) {
				res.writeHead(200, {'Content-Type': 'text/html'});
				var webpage = String(data).split('{{DATA}}');
				
				showsTable.sort(sortFunction);
				function sortFunction(a, b) {
				    if (a[0] === b[0]) {
				        return 0;
				    }
				    else {
				        return (a[0] < b[0]) ? -1 : 1;
				    }
				}

				var result = webpage[0]
				for (var i = 0; i < showsTable.length; i++) {
					if (showsTable[i] != undefined) {
						result += showsTable[i][1];
					}
				}
				result += webpage[1];

				res.write(result);
				res.end();
			});
		}, 200);


	} else if (req.url.substring(0, 22) === '/html/show-editor.html') {
		console.log("Serving " + req.url);
		var fileName = req.url.substring(32, req.url.length);

		console.log(fileName);

		fs.readFile('./shows/' + fileName, function(err, data) {
			var fields = "";
			var thisShow = JSON.parse(String(data));
			var frames = JSON.stringify(thisShow.frames);
			fields = '<h3>Filename:</h3><code id="showFileName">' + fileName 
			+ '</code><h3>Show Name:</h3><input class="show-editor-text-input" id="showNameInput" value="' + thisShow.name + '"></input>'
			+ '<h3>Delay (milliseconds):</h3><input class="show-editor-text-input" id="delayMSinput" type="number" value="' + thisShow.delayMS 
			+ '"></input><h3>Data:</h3><textarea value="data" rows="25"class="show-editor-text-area" id="dataInput" onchange="">' 
			+ frames.substring(1, frames.length-1) + '</textarea>';

			fs.readFile('.' + req.url.substring(0, 22), function(err, data) {
				res.writeHead(200, {'Content-Type': 'text/html'});
				var webpage = String(data).split('{{DATA}}');

				var result = webpage[0] + fields + webpage[1];

				res.write(result);
				res.end();
			});
		});


	} else if (req.url === '/html/settings.html') {
		console.log("Serving " + req.url);
		var fileName = req.url.substring(32, req.url.length);

		fs.readFile('.' + req.url.substring(0, 22), function(err, data) {
			res.writeHead(200, {'Content-Type': 'text/html'});
			var webpage = String(data).split('{{DATA}}');

			var result = webpage[0] + VERSION.version() + webpage[1];

			res.write(result);
			res.end();
		});



	} else if (req.url === '/html/new-scheduler.html') {
		console.log("Serving " + req.url);	
		let filenames = fs.readdirSync("./shows/");
  		var resultTable = [];
		var i = 0;
  
		filenames.forEach((file) => {
			fs.readFile('./shows/' + file, function(err, data) {
				if (file[0] != '.') {
					var thisShow = JSON.parse(String(data));
					resultTable[i] = '<option value="' + filenames[i] + ' (' + thisShow.name + ')">' 
					+ filenames[i] + ' (' + thisShow.name + ')</option>';
				}
				i++;
			});
		});

		setTimeout(function(){
	  		fs.readFile('.' + req.url, function(err, data) {
				res.writeHead(200, {'Content-Type': 'text/html'});
				var webpage = String(data).split('{{DATA}}');

				resultTable.sort();
				
				var result = webpage[0]
				for (var i = 0; i < resultTable.length; i++) {
					if (resultTable[i] != undefined) {
						result += resultTable[i];
					}
				}
				result += webpage[1];

				res.write(result);
				res.end();
			});
		}, 200);


	} else if (req.url === '/html/scheduler.html') {
		console.log("Serving " + req.url);

		readSchedulersJSON();

		setTimeout(function(){
	  		fs.readFile('.' + req.url, function(err, data) {
				res.writeHead(200, {'Content-Type': 'text/html'});
				var webpage = String(data).split('{{DATA}}');

				var code = "";
				for (var i = 0; i < allSchedulers.schedulers.length; i++) {
					code = code + `
					<tr>
						<td>` + allSchedulers.schedulers[i].name + `</td>
						<td>` + allSchedulers.schedulers[i].showName + ` (` + allSchedulers.schedulers[i].showFileName + `)</td>
						<td>` + allSchedulers.schedulers[i].frequency + ` (` + allSchedulers.schedulers[i].frequencyRepeat + `)</td>
						<td><code>` + allSchedulers.schedulers[i].startTime + `</code></td>
						<td><code>` + allSchedulers.schedulers[i].endTime + `</code></td>
						<td><a href="../html/scheduler-editor.html?index=`
						+ i + `" class="Show_ActionButton"><i class="fas fa-edit" aria-hidden="true"></i></a>
						<a href="./scheduler.html" class="Show_ActionButton redbutton" onclick="deleteSchedulerAtIndex(` + 
						i + `)"><i class="fas fa-trash-alt" aria-hidden="true"></i></a></td>
					</tr>
					`
				}

				var result = webpage[0] + code + webpage[1];

				res.write(result);
				res.end();
			});
		}, 200);


	} else if (req.url.substring(0, 27) === '/html/scheduler-editor.html') {
		console.log("Serving " + req.url);
		var index = req.url.substring(34, req.url.length);

		let filenames = fs.readdirSync("./shows/");
  		var resultTable = [];
		var i = 0;
  
		filenames.forEach((file) => {
			fs.readFile('./shows/' + file, function(err, data) {
				if (file[0] != '.') {
					var thisShow = JSON.parse(String(data));

					if (allSchedulers.schedulers[index].showFileName == filenames[i]) {
						resultTable[i] = '<option value="' + filenames[i] + ' (' + thisShow.name + ')" selected="selected">' 
						+ filenames[i] + ' (' + thisShow.name + ')</option>';
					} else {
						resultTable[i] = '<option value="' + filenames[i] + ' (' + thisShow.name + ')">' 
						+ filenames[i] + ' (' + thisShow.name + ')</option>';
					}
				}
				i++;
			});
		});

		
		//allSchedulers.schedulers[index].


		setTimeout(function(){
	  		fs.readFile('.' + req.url.substring(0, 27), function(err, data) {
				res.writeHead(200, {'Content-Type': 'text/html'});
				var webpage = String(data).split('{{DATA}}');

				resultTable.sort();
				var showsDropdown = '';
				for (var i = 0; i < resultTable.length; i++) {
					if (resultTable[i] != undefined) {
						showsDropdown += resultTable[i];
					}
				}

				var code = `
					<h3>Name:</h3>
					<input class="scheduler-text-input" id="schedulerNameInput" value="` + allSchedulers.schedulers[index].name + `"></input>
					<br>

					<h3>Select Show:</h3>
					<select class="scheduler-shows-dropdown" id="schedulerShowInput">
						<option value="">-- Choose --</option>
						` + showsDropdown + `
					</select>
					<br>

					<h3>Timing: </h3>
					<div class="scheduler-time-input-div">
						Start Time: &nbsp;
						<input type="time" class="scheduler-time-input" id="start-time" value="` + allSchedulers.schedulers[index].startTime 
						+ `"></input>
						<br>
						End Time: &nbsp;&nbsp;&nbsp;
						<input type="time" class="scheduler-time-input" id="end-time" value="` + allSchedulers.schedulers[index].endTime
						 + `"></input>
						<br>
					</div>

					<div class="float scheduler-frequency-header">
						<h3>Frequency: </h3>
					</div>
					<div class="float scheduler-frequency-radios">
						<form>`
							if (allSchedulers.schedulers[index].frequency == "Daily") {
								code = code + `<input type="radio" id="frequency-daily" name="Frequency" 
								value="Daily" onclick="showFrequencyPicker(1);" checked><label for="Daily">Daily</label><br>`
							} else {
								code = code + `<input type="radio" id="frequency-daily" name="Frequency" 
								value="Daily" onclick="showFrequencyPicker(1);"><label for="Daily">Daily</label><br>`
							}

							if (allSchedulers.schedulers[index].frequency == "Weekly") {
								code = code + `<input type="radio" id="frequency-weekly" name="Frequency" 
								value="Weekly" onclick="showFrequencyPicker(2);" checked><label for="Weekly">Weekly</label><br>`
							} else {
								code = code + `<input type="radio" id="frequency-weekly" name="Frequency" 
								value="Weekly" onclick="showFrequencyPicker(2);"><label for="Weekly">Weekly</label><br>`
							}

							if (allSchedulers.schedulers[index].frequency == "One-Time") {
								code = code + `<input type="radio" id="frequency-one-time" name="Frequency" 
								value="One-Time" onclick="showFrequencyPicker(3);" checked><label for="One-Time">One Time</label>`
							} else {
								code = code + `<input type="radio" id="frequency-one-time" name="Frequency" 
								value="One-Time" onclick="showFrequencyPicker(3);"><label for="One-Time">One Time</label>`
							}
							code = code + `
						</form>
					</div>

					<div class="vl float"></div>`;

					if (allSchedulers.schedulers[index].frequency == "Daily") {
						code += `<div id="dailyRepeatPicker" style="display: block;">`
					} else {
						code += `<div id="dailyRepeatPicker" style="display: none;">`
					}
					code += `
						<div class="float scheduler-frequency-radios">
							<form>
								<input type="radio" id="EveryDay" name="dailyRepeat" value="EveryDay"`
								if (allSchedulers.schedulers[index].frequencyRepeat == 0) code += ` checked`
								code += `>
								<label><span class="boldprint">Every Day</span></label><br>
								<input type="radio" id="EveryNumberOfDays" name="dailyRepeat" value="EveryNumberOfDays"`
								if (allSchedulers.schedulers[index].frequencyRepeat != 0) code += ` checked`
								code += `>
								<label><span class="boldprint">Every </span></label>
								<input type="number" min=1 class="scheduler-days-number-input" id="scheduler-days-number-input"`
								if (allSchedulers.schedulers[index].frequencyRepeat != 0) {
									code += ` value=` + allSchedulers.schedulers[index].frequencyRepeat
								}
								code += `></input>
								<label><span class="boldprint"> days</span></label>
							</form>
						</div>
					</div>`

					var weekly = (allSchedulers.schedulers[index].frequency == "Weekly");

					if (allSchedulers.schedulers[index].frequency == "Weekly") {
						code += `<div id="weeklyRepeatPicker" style="display: block;">`
					} else {
						code += `<div id="weeklyRepeatPicker" style="display: none;">`
					}
					code += `
						<div class="float scheduler-frequency-radios">
							<form>
								<input type="checkbox" value="7" class="FrequencyCheckbox" id="Sunday"`
								if (weekly && allSchedulers.schedulers[index].frequencyRepeat.includes(7)) {
									code += ` checked`
								}
								code += `><label><span class="boldprint">Sunday</span></label>
								<br>
								<input type="checkbox" value="1" class="FrequencyCheckbox" id="Monday"`
								if (weekly && allSchedulers.schedulers[index].frequencyRepeat.includes(1)) {
									code += ` checked`
								}
								code += `>
								<label><span class="boldprint">Monday</span></label>
								<br>
								<input type="checkbox" value="2" class="FrequencyCheckbox" id="Tuesday"`
								if (weekly && allSchedulers.schedulers[index].frequencyRepeat.includes(2)) {
									code += ` checked`
								}
								code += `>
								<label><span class="boldprint">Tuesday</span></label>
								<br>
								<input type="checkbox" value="3" class="FrequencyCheckbox" id="Wednesday"`
								if (weekly && allSchedulers.schedulers[index].frequencyRepeat.includes(3)) {
									code += ` checked`
								}
								code += `>
								<label><span class="boldprint">Wednesday</span></label>
								<br>
								<input type="checkbox" value="4" class="FrequencyCheckbox" id="Thursday"`
								if (weekly && allSchedulers.schedulers[index].frequencyRepeat.includes(4)) {
									code += ` checked`
								}
								code += `>
								<label><span class="boldprint">Thursday</span></label>
								<br>
								<input type="checkbox" value="5" class="FrequencyCheckbox" id="Friday"`
								if (weekly && allSchedulers.schedulers[index].frequencyRepeat.includes(5)) {
									code += ` checked`
								}
								code += `>
								<label><span class="boldprint">Friday</span></label>
								<br>
								<input type="checkbox" value="6" class="FrequencyCheckbox" id="Saturday"`
								if (weekly && allSchedulers.schedulers[index].frequencyRepeat.includes(6)) {
									code += ` checked`
								}
								code += `>
								<label><span class="boldprint">Saturday</span></label>
							</form>
						</div>
					</div>`

					if (allSchedulers.schedulers[index].frequency == "One-Time") {
						code += `<div id="onetimeRepeatPicker" style="display: block;">`
					} else {
						code += `<div id="onetimeRepeatPicker" style="display: none;">`
					}
					code += `
						<div class="float scheduler-frequency-radios">
							<form>
								<input type="date" id="one-time-date" name="one-time-date" min="2021-05-01" value=`
								+ allSchedulers.schedulers[index].frequencyRepeat +
								`>
							</form>
						</div>
					</div>

					<div style="width: 100%"><br><br><br><br><br><br><br><br><br><br></div>

					<div class="panel-full">
						<div class="show-save-box">
							<a class="show-save" href="./scheduler.html" onclick="editScheduler(` + index + `)">Save</a>
						</div>
					</div>

					<p>&nbsp</p>
				`

				var result = webpage[0] + code + webpage[1];

				res.write(result);
				res.end();
			});
		}, 200);


	} else {
		// otherwise serve whatever file is asked for
		console.log("Serving ." + req.url);	

  		fs.readFile('.' + req.url, function(err, data) {
			res.writeHead(200);
			res.write(data);
			//console.log(String(data));
			res.end();
		});

	}
}).listen(8080);





























/* ================================================= */
/*  WEB SOCKETS                                      */
/* ================================================= */
wss.on('connection', ((ws) => {
  	ws.on('message', (message) => {
  		//console.log(message)

	  	// DMX CHANNEL CONTROL WEBSOCKETS
	  	if (message.substring(0, 6) == "setDMX") {
	  		var ch = parseInt(message.substring(7, 10));
	  		var val = parseInt(message.substring(11, 14));
	  		//console.log("Set channel " + ch + " to " + val)
	  		engine.outputDMX(ch, val);
	  	}


	  	if (message.substring(0, 21) == "restoreDMXchannelSave") {
	  		var ch = message.substring(22, 25);

	  		fs.readFile('./dmx-channels-save.txt', function(err, data) {
				var all = String(data).split(',');
				var chValCombo = all[parseInt(ch)-1];
				var val = chValCombo.substring(4, 7);
				ws.send('restoreDMXchannelSave(' + ch + ':' + val + ')');
			});
	  	}

	  	if (message.substring(0, 14) == "saveDMXchannel") {
	  		var ch = message.substring(15, 18);
			var val = message.substring(19, 22);
			var fileData = "";

	  		fs.readFile('./dmx-channels-save.txt', function(err, data) {
				fileData = String(data).split(',');
				fileData[parseInt(ch)-1] = String(ch + ":" + val + "");
		  		var newFileData = fileData.join(",");

				fs.writeFile('./dmx-channels-save.txt', newFileData, err => {
				  	if (err) {
				    	console.error(err)
				    	return
				  	}
				})
			});
	  	}



	  	// SHOW EDITING SOCKETS
	  	if (message.substring(0, 13) == "createNewShow") {
	  		console.log(colors.cyan("Creating new show " + message.substring(14, message.length)));
	  		eval(message);
	  	}


		if (message.substring(0, 10) == "renameShow") {
	  		var temp1 = message.substring(11, message.length-1);
	  		var temp2 = temp1.split(',');
	  		var showFileName = temp2[0];
	  		var newShowName = temp2[1];
	  		console.log(colors.cyan("Renaming show " + './shows/' + showFileName + ' with new name "' + newShowName + '"'));

	  		fs.readFile('./shows/' + showFileName, function(err, data) {
				var show = JSON.parse(data);
				show.name = newShowName;

				var fileData = JSON.stringify(show);
				fs.writeFile('./shows/' + showFileName, fileData, err => {
				  	if (err) {
				    	console.error(err)
				    	return
				  	}
				})
			});
	  	}


	  	if (message.substring(0, 10) == "deleteShow") {
	  		var showFileName = message.substring(11, message.length-1);
	  		console.log(colors.cyan.inverse("Deleting show " + './shows/' + showFileName));

	  		try {
			  	fs.unlinkSync('./shows/' + showFileName)
			} catch(err) {
			  	console.error(err)
			}
	  	}




	  	// SCHEDULER EDITING SOCKETS
	  	if (message.substring(0, 12) == "addScheduler") {
	  		console.log(colors.cyan("Adding new scheduler " + message.substring(13, message.length)));
	  		eval(message);
	  	}

	  	if (message.substring(0, 13) == "editScheduler") {
	  		var messageSplit = message.split(']');
	  		var index = messageSplit[0].substring(14, messageSplit[0].length);
	  		var object = eval("returnObject" + messageSplit[1]);
	  		allSchedulers.schedulers[index] = object;
			updateSchedulersJSON();
			console.log(colors.cyan("Edited scheduler " + index));
	  	}

	  	if (message.substring(0, 22) == "deleteSchedulerAtIndex") {
	  		console.log(colors.cyan("Deleting scheduler at index " + message.substring(23, message.length-1)));
	  		eval(message);
	  	}
	  	
	});

	ws.on('end', () => {
		console.log('Connection ended...');
	});
}));




























