const http = require('http');
const formidable = require('formidable');
const DMX = require('dmx');


const dmx = new DMX();
var universe = dmx.addUniverse('demo', 'enttec-open-usb-dmx', '/dev/ttyUSB0');

var redVal = 255;
var greenVal = 255;
var blueVal = 255;

 
const server = http.createServer((req, res) => {
  if (req.url === '/api/upload' && req.method.toLowerCase() === 'post') {
    // parse a file upload
    const form = formidable({ multiples: true });
 

    form.parse(req, (err, fields, files) => {

	redVal = fields.red;
	greenVal = fields.green;
	blueVal = fields.blue;


      // parse input
  res.writeHead(200, { 'content-type': 'text/html' });
  res.write("Form input successfully with these values: <br>");
  res.write("Red: " + redVal + "<br>");
  res.write("Green: " + greenVal + "<br>");
  res.write("Blue: " + blueVal + "<br>");
  res.write("<a href='/'>Back</a>");
  res.end();

    });
 
    return;
  }
 
  // show a file upload form
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(`
    <h2>Raspi DMX Player</h2>
    <p><code>version 0.1.0</code></p>
    <form action="/api/upload" enctype="multipart/form-data" method="post">
        <div>Red: <input type="text" name="red" /></div>
	<div>Green: <input type="text" name="green" /></div>
	<div>Blue: <input type="text" name="blue" /></div>
      <input type="submit" value="Upload" />
    </form>
  `);
});
 
server.listen(8080, () => {
  console.log('Server listening on http://localhost:8080/ ...');
});


setInterval(function(){ 
	universe.update({1: 255, 2: redVal, 3: greenVal, 4: blueVal}); 
}, 100);