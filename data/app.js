
var gateway = "ws://192.168.43.27/ws";
// var gateway = "ws://192.168.1.11/ws";

var websocket;
var wall = [];
var scale = 0.3;
var connectionStatus = "...";

var dataMap = {
  robotCor  : [[0,0,0]],
  wall      : [],
  gas       : {
                voc   : [],
                co2   : [],
                asap  : [],
                temp  : [],
                hum   : []
              }
};

window.addEventListener("load", onLoad);

function initWebSocket() {
  console.log("Trying to open a WebSocket connection...");
  websocket = new WebSocket(gateway);
  websocket.onopen    = onOpen;
  websocket.onclose   = onClose;
  websocket.onmessage = onMessage; // <-- add this line

}

function initButton() {
  document.getElementById('button_set_heading').addEventListener('click', setHeading);
  document.getElementById('button_set_forward').addEventListener('click', setForward);
  document.getElementById('button_read_sensor').addEventListener('click', readSensor);
  document.getElementById('button_calibrate_mpu').addEventListener('click', calibrateMpu);
}

function setHeading(){
  var value = document.getElementById("input_set_heading").value;
  websocket.send('setheading='+value);

  var lastRobotCorX = dataMap.robotCor[dataMap.robotCor.length-1][0];
  var lastRobotCorY = dataMap.robotCor[dataMap.robotCor.length-1][1];
  var lastRobotCorH = dataMap.robotCor[dataMap.robotCor.length-1][2];

  lastRobotCorH = lastRobotCorH + parseInt(value, 10);
  lastRobotCorH = normalizeAngle(lastRobotCorH);
  dataMap.robotCor.push([lastRobotCorX, lastRobotCorY, lastRobotCorH]);
}

function setForward(){
  var value = document.getElementById("input_set_forward").value;
  websocket.send('setforward='+value);

  var lastRobotCorX = dataMap.robotCor[dataMap.robotCor.length-1][0];
  var lastRobotCorY = dataMap.robotCor[dataMap.robotCor.length-1][1];
  var lastRobotCorH = dataMap.robotCor[dataMap.robotCor.length-1][2];
  
  angleMode(RADIANS);
  lastRobotCorX = lastRobotCorX + parseInt((sin(lastRobotCorH * 0.0174533) * parseInt(value)),10);
  lastRobotCorY = lastRobotCorY + parseInt((cos(lastRobotCorH * 0.0174533) * parseInt(value)),10);
  dataMap.robotCor.push([lastRobotCorX, lastRobotCorY, lastRobotCorH]);
}

function onOpen(event) {
  connectionStatus = "Connection opened";
}
function onClose(event) {
  connectionStatus = "Connection closed";
  setTimeout(initWebSocket, 5000);
}

function onMessage(event) {
  var lastRobotCorX = dataMap.robotCor[dataMap.robotCor.length-1][0];
  var lastRobotCorY = dataMap.robotCor[dataMap.robotCor.length-1][1];
  lastRobotCorX = (0.3*lastRobotCorX) + 70;
  lastRobotCorY = -(0.3*lastRobotCorY) + 500;
  console.log(event.data);
  var data = JSON.parse(event.data);

  angleMode(RADIANS);
  for (var i=0; i<data.wall.length; i++){
    var a = i - 180;
    a = -a + 180;
    a = (a * 0.0174533);
    var num = parseInt(data.wall[i], 10);
    if (num){
      var x = ((sin(a) * num * 0.3) + lastRobotCorX);
      var y = ((cos(a) * num * 0.3) + lastRobotCorY);

      dataMap.wall.push([x, y]);
    }
    else {
      console.log("DEBUG : Array kosong/error di index #"+i);
    }
  }

  document.getElementById('state').innerHTML = wall;
  wall = [];
}

  

// function onMessage(event) {
//   var lastRobotCorX = dataMap.robotCor[dataMap.robotCor.length-1][0];
//   var lastRobotCorY = dataMap.robotCor[dataMap.robotCor.length-1][1];
//   lastRobotCorX = (0.3*lastRobotCorX) + 70;
//   lastRobotCorY = -(0.3*lastRobotCorY) + 500;
//   console.log(event.data);
//   var data = JSON.parse(event.data);
//   var keys = Object.keys(data);
//   for (var j=0; j<360; j++){
//     if(keys[j] != "voc" && keys[j] != "co2" && keys[j] != "asap" && keys[j] != "temp" && keys[j] != "hum"){
//       var name = keys[j];
//       var strIndex = String(name);
//       var splitIndex = strIndex.split("a");
//       var intIndex = parseInt(splitIndex[1], 10);
      
//       var value = data[name];
//       wall[intIndex] = value;
//     }
//   }

//   angleMode(RADIANS);
//   for (var i=0; i<wall.length; i++){
//     var a = i - 180;
//     a = -a + 180;
//     a = (a * 0.0174533);
//     var num = parseInt(wall[i], 10);
//     if (num){
//       var x = ((sin(a) * num * 0.3) + lastRobotCorX);
//       var y = ((cos(a) * num * 0.3) + lastRobotCorY);

//       dataMap.wall.push([x, y]);
//     }
//     else {
//       console.log("DEBUG : Array kosong/error di index #"+i);
//     }
//   }

//   document.getElementById('state').innerHTML = wall;
//   wall = [];
// }

function onLoad(event) {
  initWebSocket();
  initButton();
}

function normalizeAngle(a){
  if (a < 0){
    a = 360 + a;
  }
  if (a >= 360){
    a = a - 360;
  }
  return a;
}

function calibrateMpu(){
  var lastRobotCorH = dataMap.robotCor[dataMap.robotCor.length-1][2];
  var angle_correction = lastRobotCorH + 180;
  angle_correction = normalizeAngle(angle_correction);
  websocket.send("calibratempu=" + angle_correction);
}

function readSensor(){
  websocket.send('readsensor');
}

function setup() {
  let canvas = createCanvas(850, 560);
  canvas.position(20, 80);
  // dataMap.wall.push([100, 100]);
}

function draw() {
  background("#42413F");

  var lastRobotCor = dataMap.robotCor.length-1;
  var lastRobotCorX = dataMap.robotCor[lastRobotCor][0];
  var lastRobotCorY = dataMap.robotCor[lastRobotCor][1];
  var lastRobotCorH = dataMap.robotCor[lastRobotCor][2];

  //value scale to map
  var robotCorX = (lastRobotCorX*0.3) + 70;
  var robotCorY = -(lastRobotCorY*0.3) + 500;
  
  fill(255);
  noStroke();
  textSize(15);
  textStyle(NORMAL);
  text("Connection :" + connectionStatus, 20, 20);
  text("Coordinate (x, y):"+ lastRobotCorX + ", " + lastRobotCorY, 350, 20);  // offset from edge 30px
  text("Heading :" + lastRobotCorH, 700, 20);

  // DRAW WALL
  stroke(255);
  strokeWeight(2);
  for(var i = 0; i < dataMap.wall.length; i++){
    point(dataMap.wall[i][0], dataMap.wall[i][1]);
  }

  // ROBOT MODEL
  stroke(0);
  angleMode(DEGREES);
  strokeWeight(1);
  circle(robotCorX, robotCorY, 20);
  translate(robotCorX, robotCorY);
  rotate(lastRobotCorH);
  rect(-1, 4, 2, -30);
}


