


var scheduler1 = {
  	name: "Day Show",
  	showName: "RGB Basic",
  	showFileName: "show001.json",
  	frequency: "Daily",
  	frequencyRepeat: 2,
  	startTime: "09:00",
  	endTime: "17:00"
};

var scheduler2 = {
  	name: "Night Show",
  	showName: "RGB Basic",
  	showFileName: "show002.json",
  	frequency: "Weekly",
  	frequencyRepeat: [1,2,5,7],
  	startTime: "09:00",
  	endTime: "17:00"
};

var scheduler3 = {
  	name: "overnight Show",
  	showName: "RGB Basic",
  	showFileName: "show002.json",
  	frequency: "One Time",
  	frequencyRepeat: "05/14/2021",
  	startTime: "09:00",
  	endTime: "17:00"
};


console.log(scheduler1);


var allSchedulers = {
	schedulers: [
		scheduler1,
		scheduler2,
		scheduler3
	],
	addScheduler: function(name, showName, showFileName, frequency, frequencyRepeat, startTime, endTime) {
		var newScheduler = {
		  	name: name,
		  	showName: showName,
		  	showFileName: showFileName,
		  	frequency: frequency,
		  	frequencyRepeat: frequencyRepeat,
		  	startTime: startTime,
		  	endTime: endTime
		}
		this.schedulers.push(newScheduler)
	}
}


console.log(allSchedulers);

allSchedulers.addScheduler("new one", "rgb basic fast", "show001.json", "Daily", 4, "0900", "1800");

console.log(allSchedulers);


console.log("PROTOTYPE")

// PROTOTYPE
function Scheduler(name, showName, showFileName, frequency, startTime, endTime) {
	this.name = name;
	this.showName = showName;
	this.showFileName = showFileName;
	this.frequency = frequency;
	this.startTime = startTime;
	this.endTime = endTime;
}

/*
var show2 = new Show("Red Green", 100);
console.log(show2)


show2.addFrame([255, 0, 0])
show2.addFrame([0, 255, 0])
show2.addFrame([0, 0, 255])

console.log(show2)
playShow(show2)

*/



















