var gateway = "ws://192.168.43.27/ws";
// var gateway = "ws://192.168.1.11/ws";

var websocket;
var wall = [];
let scale = 0.3;
var connectionStatus = "...";

var dataMap = {
  robotCor  : [
                [0,0,0]
              ],                // [X, Y, H]
  wall      : [],
  gas       : {
                voc   : [
                          //[100,100,500]  // [X, Y, VALUE]
                        ],
                co2   : [
                          //[100, 100,300]
                        ],
                smoke : [],
                temp  : [],
                hum   : []
              }
};


let inputForward;
let inputHeading;
let buttonForward;
let buttonHeading;
let buttonReadSensor;
let buttonCalibrateMpu;

let buttonDownloadMap;
let radioAutoManual;

let buttonStartAuto;
let buttonStopAuto;
let buttonHoming;

let mode = 0;

let seqCalibrateMpu = 0;
let seqReadSensor = 0;
let seqForward = 0;
let seqHeading = 0;
let waiting = 0;

window.addEventListener("load", onLoad);

function initWebSocket() {
  console.log("Trying to open a WebSocket connection...");
  websocket = new WebSocket(gateway);
  websocket.onopen    = onOpen;
  websocket.onclose   = onClose;
  websocket.onmessage = onMessage; // <-- add this line

}

// function initButton() {
//   document.getElementById("button_set_heading").addEventListener("click", setHeading);
//   document.getElementById("button_set_forward").addEventListener("click", setForward);
//   document.getElementById("button_read_sensor").addEventListener("click", readSensor);
//   document.getElementById("button_calibrate_mpu").addEventListener("click", calibrateMpu);
// }

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
  lastRobotCorX = (scale*lastRobotCorX) + 70;
  lastRobotCorY = -(scale*lastRobotCorY) + 500;
  // console.log(event.data);
  if(event.data.length > 100){
    var data = JSON.parse(event.data);
    angleMode(RADIANS);
    for (var i=0; i<data.wall.length; i++){
      var a = i - 180;
      a = -a + 180;
      a = (a * 0.0174533);
      var num = parseInt(data.wall[i], 10);
      if (num){
        var x = ((sin(a) * num * scale) + lastRobotCorX);
        var y = ((cos(a) * num * scale) + lastRobotCorY);

        dataMap.wall.push([x, y]);
      }
      else {
        console.log("DEBUG : Array kosong/error di index #"+i);
      }
    }
    dataMap.gas.voc.push([lastRobotCorX, lastRobotCorY, parseInt(data.gas.voc, 10)]);
    dataMap.gas.co2.push([lastRobotCorX, lastRobotCorY, parseInt(data.gas.co2, 10)]);

    // document.getElementById("state").innerHTML = wall;
    wall = [];
    sequence("readsensorcomplete");
  }
  else {
    sequence(event.data);
  }
}

function sequence(completeCommand){
  switch (completeCommand){
    case (completeCommand == "calibratempucomplete") :
      seqCalibrateMpu = 1;
      seqReadSensor   = 0;
      seqForward      = 0;
      seqHeading      = 0;
      break;

    case (completeCommand == "readsensorcomplete") :
      seqCalibrateMpu = 0;
      seqReadSensor   = 1;
      seqForward      = 0;
      seqHeading      = 0;
      break;

    case (completeCommand == "setforwardcomplete") :
      seqCalibrateMpu = 0;
      seqReadSensor   = 0;
      seqForward      = 1;
      seqHeading      = 0;
      break;

    case (completeCommand == "setheadingcomplete") :
      seqCalibrateMpu = 0;
      seqReadSensor   = 0;
      seqForward      = 0;
      seqHeading      = 1;
      break;
  }
  waiting = 0;
}

function onLoad(event) {
  initWebSocket();
  // initButton();
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
  // if (mode == 0){
    var lastRobotCorH = dataMap.robotCor[dataMap.robotCor.length-1][2];
    var angleCorrection = lastRobotCorH + 180;
    angleCorrection = normalizeAngle(angleCorrection);
    websocket.send("calibratempu=" + angleCorrection);
  // } else{
  //   alert("SEDANG MODE AUTO");
  // }
}

function readSensor(){
  // if(mode == 0){
    websocket.send("readsensor");
  // } else{
  //   alert("SEDANG  MODE AUTO");
  // }
}

function setHeading(){
  // if(mode == 0){
    // var value = document.getElementById("input_set_heading").value;
    var value = inputHeading.value();
    websocket.send("setheading=" + value);
    var lastRobotCorX = dataMap.robotCor[dataMap.robotCor.length-1][0];
    var lastRobotCorY = dataMap.robotCor[dataMap.robotCor.length-1][1];
    var lastRobotCorH = dataMap.robotCor[dataMap.robotCor.length-1][2];

    lastRobotCorH = lastRobotCorH + parseInt(value, 10);
    lastRobotCorH = normalizeAngle(lastRobotCorH);
    dataMap.robotCor.push([lastRobotCorX, lastRobotCorY, lastRobotCorH]);
  // }else{
  //   alert("SEDANG  MODE AUTO");
  // }
}

function setForward(){
  // if (mode == 0){
    var value = inputForward.value();
    // var value = document.getElementById("input_set_forward").value;
    websocket.send("setforward=" + value);

    var lastRobotCorX = dataMap.robotCor[dataMap.robotCor.length-1][0];
    var lastRobotCorY = dataMap.robotCor[dataMap.robotCor.length-1][1];
    var lastRobotCorH = dataMap.robotCor[dataMap.robotCor.length-1][2];
    
    angleMode(RADIANS);
    lastRobotCorX = lastRobotCorX + parseInt((sin(lastRobotCorH * 0.0174533) * parseInt(value, 10)),10);
    lastRobotCorY = lastRobotCorY + parseInt((cos(lastRobotCorH * 0.0174533) * parseInt(value, 10)),10);
    dataMap.robotCor.push([lastRobotCorX, lastRobotCorY, lastRobotCorH]);
  // } else{
  //   alert("SEDANG  MODE AUTO");
  // }
}

function startAuto(){
  mode = 1;
}

function stopAuto(){
  mode = 0;
}


function setup() {
  let canvas = createCanvas(windowWidth - 50, windowHeight -100);
  canvas.position(20, 70);

  let controlSpacer = displayWidth - (displayWidth/4);
  let firstLine = 150;
  let spaceY = 30;
  
  // CONTROL
  inputForward = createInput("");
  inputForward.position(controlSpacer + 30 , firstLine);
  inputForward.size(70);

  inputHeading = createInput("");
  inputHeading.position(controlSpacer + 30 , firstLine + (1*spaceY));
  inputHeading.size(70);

  buttonForward = createButton("set Forward");
  buttonForward.position(controlSpacer + 120, firstLine);
  buttonForward.mousePressed(setForward);

  buttonHeading = createButton("set Heading");
  buttonHeading.position(controlSpacer + 120, firstLine + (1*spaceY));
  buttonHeading.mousePressed(setHeading);

  buttonReadSensor = createButton("read Sensor");
  buttonReadSensor.position(controlSpacer + 120, firstLine + (2*spaceY));
  buttonReadSensor.mousePressed(readSensor);

  buttonCalibrateMpu = createButton("calibrate mpu" ,10);
  buttonCalibrateMpu.position(controlSpacer + 120, firstLine + (3*spaceY));
  buttonCalibrateMpu.mousePressed(calibrateMpu);

  radioAutoManual = createRadio();
  radioAutoManual.option("MANUAL");
  radioAutoManual.option("AUTO");
  radioAutoManual.position(controlSpacer + 120, firstLine + (5*spaceY));
  // radioAutoManual.mousePressed(autoManual);
  radioAutoManual.style("width","100px");

  buttonStartAuto = createButton("START AUTO");
  buttonStartAuto.position(controlSpacer + 30, firstLine + (8*spaceY));
  buttonStartAuto.mousePressed(startAuto);

  buttonStopAuto = createButton("STOP AUTO");
  buttonStopAuto.position(controlSpacer + 150, firstLine + (8*spaceY));
  buttonStopAuto.mousePressed(stopAuto);

  buttonHoming = createButton("RETURN TO HOME");
  buttonHoming.position(controlSpacer + 60, firstLine + (9*spaceY));
  buttonHoming.mousePressed(stopAuto);
}

function draw() {
  background("#42413F");
  let controlSpacer = displayWidth - (displayWidth/4);
  line (controlSpacer, displayHeight, controlSpacer, 0);
  rect(controlSpacer, -1, controlSpacer , displayHeight);

  var lastRobotCor = dataMap.robotCor.length-1;
  var lastRobotCorX = dataMap.robotCor[lastRobotCor][0];
  var lastRobotCorY = dataMap.robotCor[lastRobotCor][1];
  var lastRobotCorH = dataMap.robotCor[lastRobotCor][2];

  //value scale to map
  var robotCorX = (lastRobotCorX*scale) + 70;
  var robotCorY = -(lastRobotCorY*scale) + 500;

  fill(0);
  textSize(14);
  textStyle(NORMAL);
  text("MANUAL CONTROL", controlSpacer + 70, 50);
  text("AUTO CONTROL", controlSpacer + 70, 300);

  fill(255);
  // noStroke();
  
  text("Connection : " + connectionStatus, 20, 20);
  text("Coordinate (x, y): " + lastRobotCorX + ", " + lastRobotCorY, 300, 20);  // offset from edge 30px
  text("Heading : " + lastRobotCorH, 500, 20);
  text("Battery : ", 650, 20);
  text("Robot Status : ", 750, 20);

  // DRAW WALL
  stroke(255);
  strokeWeight(2);
  for(var i = 0; i < dataMap.wall.length; i++){
    point(dataMap.wall[i][0], dataMap.wall[i][1]);
  }

  // DRAW GAS VOC
  for (var i = 0; i < dataMap.gas.voc.length; i++){
    stroke(255,255,0);
    strokeWeight(10);
    point(dataMap.gas.voc[i][0], dataMap.gas.voc[i][1]);

    noStroke();
    textSize(10);
    text("VOC : " + dataMap.gas.voc[i][2] + " ppm", dataMap.gas.voc[i][0] + 30, dataMap.gas.voc[i][1] - 30);
    text("CO2 : " + dataMap.gas.co2[i][2] + " ppm", dataMap.gas.co2[i][0] + 30, dataMap.gas.co2[i][1] - 20);

    stroke(255);
    strokeWeight(1);
    line(dataMap.gas.voc[i][0] + 5, dataMap.gas.voc[i][1] - 5, dataMap.gas.voc[i][0] + 30, dataMap.gas.voc[i][1] - 30);
  }

  // ROBOT MODEL
  stroke(0);
  strokeWeight(1);
  angleMode(DEGREES);
  circle(robotCorX, robotCorY, 20);
  translate(robotCorX, robotCorY);
  rotate(lastRobotCorH);
  rect(-1, 4, 2, -30);

  if (mode == 1){
    if (waiting == 0){
      // 1 calibrate mpu
      if (seqForward == 0 && seqHeading == 0 && seqReadSensor == 0 && seqCalibrateMpu == 0){
        calibrateMpu();
        waiting = 1;
      }
      if (seqCalibrateMpu == 1){
        readSensor();
        waiting = 1;
      }
      if (seqReadSensor == 1){
      setForward();
      waiting =1
    }
  }
    
    console.log("AUTO");
    // 2 read sensor

    // 3 setforward 100

    // 4 calibrate mpu
    // 5 read sensor
  }
}