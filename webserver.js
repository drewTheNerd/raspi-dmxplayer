// webserver.js
// The primary NodeJS app of Raspi DMX Player. 
// Written by and copyright Drew Shipps.
const VERSION = require('./_version');
console.log("webserver.js | Raspi DMX Player");
console.log("Version " + VERSION.version());

var http = require('http');
var fs = require('fs');

const DMX = require('dmx');
const dmx = new DMX();
var universe = dmx.addUniverse('universe1', 'enttec-open-usb-dmx', '/dev/ttyUSB0');


var nextShowToEdit;


http.createServer(function (req, res) {
	if (req.url === '/favicon.ico' || req.url.substring(0, 11) === '/socket.io/') {
		// do nothing because this is not stored on the local server
		console.log("The requested URL does not exist on this server. (" + req.url + ")")
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





'use strict';

const WebSocketServer = require('ws').Server
const wss = new WebSocketServer({ port: 8081 });

wss.on('connection', ((ws) => {
  ws.on('message', (message) => {
  	//ws.send('Hello Client. you told me ' + message + ' and i said no.');
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





  	if (message.substring(0, 14) == "nextShowToEdit") {
  		nextShowToEdit = message.substring(15, message.length-1);
  	}
  	if (message.substring(0, 15) == "whatShowToEdit?") {
  		ws.send('whatShowToEdit?("' + String(nextShowToEdit) + '")');
  	}

  	if (message.substring(0, 7) == "getShow") {
  		var showFileName = message.substring(8, message.length-1);
  		console.log("getting show " + './shows/' + showFileName)

  		fs.readFile('./shows/' + showFileName, function(err, data) {
			ws.send('getShow("' + String(data) + '")');
		});
  	}


  	if (message.substring(0, 8) == "saveShow") {
  		var fileData = message;
  		var splitFileData = fileData.split("](");

  		var fileName = splitFileData[0].substring(9, splitFileData[0].length);
  		var showFileData = splitFileData[1].substring(0, splitFileData[1].length-1);

  		console.log("Saving to show " + './shows/' + fileName);
  		fs.writeFile('./shows/' + fileName, showFileData, err => {
		  	if (err) {
		    	console.error(err)
		    	return
		  	}
		})
  	}
  });

  ws.on('end', () => {
    console.log('Connection ended...');
  });

  ws.send('Hello Client. Drew was here...');
}));





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