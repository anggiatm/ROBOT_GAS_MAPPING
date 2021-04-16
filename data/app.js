// // where the serial server is (your local machine):
// var ledOn = false;
// var host = '192.168.43.27';
// var socket; // the websocket
// var sensorValue = 0; // the sensor value

// window.addEventListener('load', onLoad);

// function onLoad(event) {
//   initWebSocket();
//   initButton();
//   //setup();
// }

// function initWebSocket(){
//   socket = new WebSocket('ws://' + host + '/ws');
//   socket.onopen    = onOpen;
//   socket.onclose   = onClose;
//   socket.onmessage = onMessage;
// }

// function onOpen(event) {
//   console.log('Connection opened');
// }

// function onClose(event) {
//   console.log('Connection closed');
//   setTimeout(initWebSocket, 2000);
// }

// function onMessage(event) {
//   //var state;
//   var msg = event.data; // read data from the onmessage event

//   // if(msg == "")

//   //   if (event.data == "1"){
//   //     state = "ON";
//   //   }
//   //   else{
//   //     state = "OFF";
//   //   }

//   document.getElementById('state').innerHTML = msg;
//   console.log(msg);
  
//   //sensorValue = Number(msg) / 4;
//   //println(sensorValue); // print it
// }

// function toggleLed(){
//   socket.send('toggleLed');
// }

// function getHeading(){
//   socket.send('getHeading');
// }

// function setHeading(){
//   socket.send('setHeading');
// }

// function initButton() {
//   document.getElementById('ledToggle').addEventListener('click', toggleLed);
//   document.getElementById('getHeading').addEventListener('click', getHeading);
//   document.getElementById('setHeading').addEventListener('click', setHeading);
// }


var gateway = `ws://192.168.43.27/ws`;
var websocket;

var con = "----";
var cor_X = 0;
var cor_Y = 0;
var angle = 0;
var head_x = 0;
var head_y = 0;

window.addEventListener('load', onLoad);


function initWebSocket() {
  console.log('Trying to open a WebSocket connection...');
  websocket = new WebSocket(gateway);
  websocket.onopen    = onOpen;
  websocket.onclose   = onClose;
  websocket.onmessage = onMessage; // <-- add this line
}

function onOpen(event) {
  console.log('Connection opened');
}
function onClose(event) {
  console.log('Connection closed');
  setTimeout(initWebSocket, 2000);
}
function onMessage(event) {
  var state;
  if (event.data == "1"){
    state = "ON";
  }
  else{
    state = "OFF";
  }
  document.getElementById('state').innerHTML = state;
}
function onLoad(event) {
  initWebSocket();
  initButton();
}

function initButton() {
  document.getElementById('button_set_heading').addEventListener('click', setHeading);
  document.getElementById('button_get_heading').addEventListener('click', getHeading);
  document.getElementById('button_set_coordinate').addEventListener('click', setCoordinate);
  document.getElementById('button_get_coordinate').addEventListener('click', getCoordinate);
  document.getElementById('button').addEventListener('click', toggle);
}

function toggle(){
  websocket.send('led=toggle');
}

function setHeading(){
  var heading_value = document.getElementById('input_set_heading').value;
  websocket.send('setheading='+heading_value);
}

function getHeading(){
  websocket.send('getheading');
}

function setCoordinate(){
  var x = document.getElementById('input_set_x').value;
  var y = document.getElementById('input_set_y').value;
  websocket.send('setcoordinate='+x+','+y);
}

function getCoordinate(){
  websocket.send('getcoordinate');
}




function setup() {
  let cnv = createCanvas(850, 550);
  cnv.position(20, 90);
  background("#42413F");
  //angleMode(RAD);
  //initWebSocket();
}

function draw() {
  fill(255);
  //ellipse(sensorValue, height / 2, 20, 20);
  noStroke();
  textSize(15);
  textStyle(NORMAL);
  text("Connection :"+con, 20, 20);
  text("Coordinate :"+ cor_X + ", " + cor_Y, 350, 20);  // offset from edge 30
  text("Heading :"+ angle, 700, 20);
  stroke(0);
  ellipse(cor_X+30, -cor_Y+520, 20, 20);
  head_x = 20*(sin(angle));
  head_y = -sqrt(pow(20,2)-pow(head_x,2));
  line(cor_X+30, -cor_Y+520, (cor_X+30)+head_x, cor_Y+520+head_y);

  //text(Math.sin(45)*, 200,200);
}


