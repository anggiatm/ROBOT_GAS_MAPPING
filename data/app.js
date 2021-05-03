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
var cor_x = 0;
var cor_y = 0;
var angle = 0;
var head_x = 0;
var head_y = 0;
var wall = [];
var scale = 0.5;
scanDataAvailable = 0;

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
  var data = JSON.parse(event.data);
  var keys = Object.keys(data);
  for (var j=0; j<360; j++){
    if(keys[j] != "voc" && keys[j] != "co2" && keys[j] != "asap" && keys[j] != "temp" && keys[j] != "hum"){
      var name = keys[j];
      var strIndex = String(name);
      var splitIndex = strIndex.split("a");
      var intIndex = parseInt(splitIndex[1]);
      
      var value = data[name];
      wall[intIndex] = value;
    }
  }
  document.getElementById('state').innerHTML = wall;
  scanDataAvailable = 1;
  //document.getElementById('state').innerHTML = event.data;
}

function onLoad(event) {
  initWebSocket();
  initButton();
}

function initButton() {
  document.getElementById('button_set_heading').addEventListener('click', setHeading);
  document.getElementById('button_set_forward').addEventListener('click', setForward);
  document.getElementById('button_read_sensor').addEventListener('click', readSensor);
  //document.getElementById('button').addEventListener('click', toggle);
}

function setHeading(){
  var heading_value = document.getElementById('input_set_heading').value;
  websocket.send('setheading='+heading_value);
}

function setForward(){
  var x = document.getElementById('input_set_forward').value;
  websocket.send('setforward='+x);
}

function readSensor(){
  websocket.send('readsensor');
}

// function toggle(){
//   websocket.send('led=toggle');
// }



// function getHeading(){
//   websocket.send('getheading');
// }

function drawScanValue(){
  
}



function setup() {
  let cnv = createCanvas(850, 560);
  cnv.position(20, 80);
  background("#42413F");
}

function draw() {
  var robot_cor_x = cor_x + 70;
  var robot_cor_y = -cor_y + 500;
  fill(255);
  noStroke();
  textSize(15);
  textStyle(NORMAL);
  text("Connection :"+con, 20, 20);
  text("Coordinate (x, y):"+ cor_x + ", " + cor_y, 350, 20);  // offset from edge 30
  text("Heading :"+ angle, 700, 20);
  
  if (wall.length > 1){
    stroke(255);
    strokeWeight(2);
    angleMode(RADIANS);
    for (var i=0; i<wall.length; i++){
      var a = (i * 0.0174533);
      var num = parseInt(wall[i]);
      if (num){
        var x = ((sin(a) * num * 0.3) + robot_cor_x);
        var y = ((cos(a) * num * 0.3) + robot_cor_y);
      }
      else {
        console.log("DEBUG : Array kosong/error di index #"+i);
      }
      point (x , y);
    }
    wall = [];
  }

  stroke(0);
  angleMode(DEGREES);
  strokeWeight(1);
  circle(robot_cor_x, robot_cor_y, 20);
  translate(robot_cor_x, robot_cor_y);
  rotate(angle);
  rect(-1, 4, 2, -30);
 
  
  
}


