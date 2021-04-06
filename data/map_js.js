// where the serial server is (your local machine):
var ledOn = false;
var host = '192.168.43.27';
var socket; // the websocket
var sensorValue = 0; // the sensor value

window.addEventListener('load', onLoad);

function onLoad(event) {
  initWebSocket();
  initButton();
  //setup();
}

function initWebSocket(){
  socket = new WebSocket('ws://' + host + '/ws');
  socket.onopen    = onOpen;
  socket.onclose   = onClose;
  socket.onmessage = onMessage;
}

function onOpen(event) {
  console.log('Connection opened');
}

function onClose(event) {
  console.log('Connection closed');
  setTimeout(initWebSocket, 2000);
}

function onMessage(event) {
  //var state;
  var msg = event.data; // read data from the onmessage event

  // if(msg == "")

  //   if (event.data == "1"){
  //     state = "ON";
  //   }
  //   else{
  //     state = "OFF";
  //   }

  document.getElementById('state').innerHTML = msg;
  console.log(msg);
  
  //sensorValue = Number(msg) / 4;
  //println(sensorValue); // print it
}

function toggleLed(){
  socket.send('toggleLed');
}

function getHeading(){
  socket.send('getHeading');
}

function setHeading(){
  socket.send('setHeading');
}

function initButton() {
  document.getElementById('ledToggle').addEventListener('click', toggleLed);
  document.getElementById('getHeading').addEventListener('click', getHeading);
  document.getElementById('setHeading').addEventListener('click', setHeading);
}


function setup() {
  createCanvas(400, 400);
  //initWebSocket();

}

function draw() {
  background("#2307AF");
  fill(255);
  ellipse(sensorValue, height / 2, 20, 20);
  text(sensorValue, 20, 20);
}


