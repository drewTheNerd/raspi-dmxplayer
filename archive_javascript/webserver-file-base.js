var http = require('http');
var fs = require('fs');


http.createServer(function (req, res) {

	if (req.url === '/favicon.ico') {
		// do nothing because this is not stored on the local server
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
				+ '<td><button class="Show_ActionButton"><i class="fas fa-edit"></i></button><button class="Show_ActionButton redbutton"><i class="fas fa-trash-alt"></i></button></td>'
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
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write(data);
			//console.log(String(data));
			res.end();
		});
	}
}).listen(8080);