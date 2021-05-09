var fs = require('fs');


// Playback show function
function playShow(show) {
	console.log("Playing show " + show.name);

	var currentFrame = 0;
	setInterval(function(){
		for (var i = 0; i < show.frames[currentFrame].length; i++) {
			var ch = i + 1;
			var val = show.frames[currentFrame][i];
			console.log("Set channel " + ch + " to value " + val);
		}

		if (currentFrame < show.frames.length-1) currentFrame++;
		else currentFrame = 0;
	}, show.delayMS);
}

// Show Prototype
function Show(name, delayMS) {
	this.name = name;
	this.delayMS = delayMS;
	this.frames = [];
	this.addFrame = function(frameData) {
	  	this.frames[this.frames.length] = frameData;
	}
}


var show1 = new Show("JSON Test", 100);
show1.addFrame([255, 0, 0])
show1.addFrame([0, 255, 0])
show1.addFrame([0, 0, 255])


/*
var fileName = "show001.json";
var fileData = JSON.stringify(show1);
fs.writeFile('./shows/' + fileName, fileData, err => {
  	if (err) {
    	console.error(err)
    	return
  	}
})



setTimeout(function(){ 
	fs.readFile('./shows/show001.json', function(err, data) {
		var show1read = JSON.parse(data);
		console.log(show1read);
	});
}, 3000);
*/


playShow(show1);









// ----------------- OBJECT WITH LIST OF JSON
function readFiles(dirname, onFileContent, onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      fs.readFile(dirname + filename, 'utf-8', function(err, content) {
        if (err) {
          onError(err);
          return;
        }
        onFileContent(filename, content);
      });
    });
    setTimeout(function(){ console.log(data) }, 200);
  });
}


var data = {};
readFiles('./shows/', function(filename, content) {
	if (filename[0] != '.') {
  		data[filename] = content;
	}
}, function(err) {
  throw err;
});

setTimeout(function(){ console.log(data) }, 1000);









