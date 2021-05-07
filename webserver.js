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


http.createServer(function (req, res) {
	if (req.url === '/favicon.ico' || req.url.substring(0, 11) === '/socket.io/') {
		// do nothing because this is not stored on the local server
		console.log("The requested URL does not exist on this server. (" + req.url + ")")
	} else if (req.url === '/html/shows.html') {

		console.log("Serving ." + req.url);	

  		fs.readFile('.' + req.url, function(err, data) {
			res.writeHead(200, {'Content-Type': 'text/html'});
			console.log(String(data));
			var webpage = String(data).split('{{DATA}}')
			var show1dataArray;
			var fileName = "show1.txt";

			fs.readFile('./shows/' + fileName, function(err, show1data) {
				show1dataArray = String(show1data).split(',');
				console.log(show1dataArray);


				var result = webpage[0] + '<tr>'
				+ '<td>' + show1dataArray[0].substring(6, show1dataArray[0].length-1) + '<button class="Show_ActionButton Show_ActionButton_Right" onclick="editShow(1)"><i class="fas fa-pen"></i></button></td>'
				+ '<td>' + fileName + '</td>'
				+ '<td><button class="Show_ActionButton" onclick="eventEmitter.emit(\'scream\');"><i class="fas fa-edit"></i></button><button class="Show_ActionButton redbutton"><i class="fas fa-trash-alt"></i></button></td>'
				+ '</tr>'
				+ webpage[1];




				res.write(result);
				res.end();


			});
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
  		var ch = message.substring(7, 10);
  		var val = message.substring(11, 14);
  		console.log("Set channel " + ch + " to " + val)
  		universe.update({ch: val});
  	}
  });

  ws.on('end', () => {
    console.log('Connection ended...');
  });

  ws.send('Hello Client. Drew was here...');
}));