function updateLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(sendLocation);
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}

function sendLocation(position) {
  ws.send("Coordinates," + position.coords.latitude + "," + position.coords.longitude);
}