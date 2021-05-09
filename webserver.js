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

const DMX = require('dmx');
const dmx = new DMX();
var universe = dmx.addUniverse('universe1', 'enttec-open-usb-dmx', '/dev/cu.usbserial-AH06H3UD'); // /dev/ttyUSB0 on raspi



/* ================================================= */
/*  INIT                                             */
/* ================================================= */
console.log("Raspi DMX Player".info);
console.log("Version ".info + VERSION.version().info);



/* ================================================= */
/*  VARIABLES                                        */
/* ================================================= */
var nextShowToEdit;
var playShowInterval;


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



// TEMP
function playShow(show) {
	console.log("Function playing show " + show.name);
	console.log(show)

	show.frames = JSON.parse(show.frames);
	console.log(show)

	var currentFrame = 0;
	playShowInterval = setInterval(function(){
		for (var i = 0; i < show.frames[currentFrame].length; i++) {
			var ch = i + 1;
			var val = show.frames[currentFrame][i];
			//console.log("Set channel " + ch + " to value " + val);
			universe.update({[ch]: val});
		}

		if (currentFrame < show.frames.length-1) currentFrame++;
		else currentFrame = 0;
	}, show.delayMS);
}













/* ================================================= */
/*  HTTP SERVER                                      */
/* ================================================= */
http.createServer(function (req, res) {
	if (req.url === '/favicon.ico' || req.url.substring(0, 11) === '/socket.io/') {
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
		var showsTable = "";

		let filenames = fs.readdirSync("./shows/");
  
		filenames.forEach((file) => {
			fs.readFile('./shows/' + file, function(err, data) {
				if (file[0] != '.') {
					var thisShow = JSON.parse(String(data));
					showsTable = showsTable + '<tr><td>'
					+ thisShow.name + '<a href="../html/shows.html" class="Show_ActionButton Show_ActionButton_Right" onclick="renameShow(\'' 
					+ file + '\',\'' + thisShow.name + '\')"><i class="fas fa-pen"></i></a></td><td>'
					+ file + '</td><td><a href="../html/show-editor.html?fileName='
					+ file + '" class="Show_ActionButton"><i class="fas fa-edit"></i></a>'
					+ '<a href="../html/shows.html" class="Show_ActionButton redbutton" onclick="deleteShow(\''
					+ file + '\')"><i class="fas fa-trash-alt"></i></a></td></tr>';
				}
			});
		});

		setTimeout(function(){
	  		fs.readFile('.' + req.url, function(err, data) {
				res.writeHead(200, {'Content-Type': 'text/html'});
				var webpage = String(data).split('{{DATA}}');

				var result = webpage[0] + showsTable + webpage[1];

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


	} else if (req.url === '/html/scheduler.html') {
		console.log("Serving " + req.url);	
		let filenames = fs.readdirSync("./shows/");
  		var code = "";

		filenames.forEach((file) => {
			fs.readFile('./shows/' + file, function(err, data) {
				if (file[0] != '.') {
					var thisShow = JSON.parse(String(data));
					code = code + '<button class="Show_ActionButton" onclick="playShow(\'' 
					+ file + '\')"><i class="fas fa-play"></i></button>Play ' + 
					+ String(file) + '<button class="Show_ActionButton" onclick="stopShow(\'' 
					+ file + '\')"><i class="fas fa-stop"></i></button><br>';
					// werid error with printing NaN here isntead of file name - maybe bc of + signs?
				}
			});
		});

		setTimeout(function(){
	  		fs.readFile('.' + req.url, function(err, data) {
				res.writeHead(200, {'Content-Type': 'text/html'});
				var webpage = String(data).split('{{DATA}}');

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

	  	// DMX CHANNEL CONTROL WEBSOCKETS
	  	if (message.substring(0, 6) == "setDMX") {
	  		var ch = parseInt(message.substring(7, 10));
	  		var val = parseInt(message.substring(11, 14));
	  		console.log("Set channel " + ch + " to " + val)
	  		universe.update({[ch]: val});
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




	  	// TEMP SHOW PLAYER SOCKET
	  	if (message.substring(0, 8) == "playShow") {
	  		var showFileName = message.substring(9, message.length-1);
	  		console.log(colors.cyan("Playing show " + './shows/' + showFileName));

	  		fs.readFile('./shows/' + showFileName, function(err, data) {
				var show = JSON.parse(data);
				playShow(show);
			});
	  	}

	  	if (message.substring(0, 8) == "stopShow") {
	  		clearInterval(playShowInterval);
	  	}
	  	
	});

	ws.on('end', () => {
		console.log('Connection ended...');
	});
}));




























