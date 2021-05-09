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


var show1 = {
  	name: "Red Blue Wave",
  	delayMS: 100,
  	frames: [
	  	[255, 0, 0],
	  	[0, 255, 0],
	  	[0, 0, 255]
  	],
  	addFrame : function(frameData) {
	  	this.frames[this.frames.length] = frameData;
	}
};


console.log(show1);


console.log(show1.frames[0]);
console.log(show1.frames[0][0]);
console.log(show1.frames.length)


show1.frames[3] = [255, 255, 255];
console.log(show1);


console.log(show1.frames.length)


show1.addFrame([0, 0, 0]);
console.log(show1);


show1.addFrame([255, 0, 0]);
console.log(show1);





console.log("PROTOTYPE")

// PROTOTYPE
function Show(name, delayMS) {
	this.name = name;
	this.delayMS = delayMS;
	this.frames = [];
	this.addFrame = function(frameData) {
	  	this.frames[this.frames.length] = frameData;
	}
}


var show2 = new Show("Red Green", 100);
console.log(show2)


show2.addFrame([255, 0, 0])
show2.addFrame([0, 255, 0])
show2.addFrame([0, 0, 255])

console.log(show2)
playShow(show2)





















