var gateway = "ws://192.168.43.27/ws";
// var gateway = "ws://192.168.1.11/ws";

var websocket;
let scale = 0.3;
var connectionStatus = "connecting....";
let robotStatus = "";
let robotMode ="Manual";

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
                smoke     : [],
                temp      : [],
                hum       : [],
                quality   : [],
                battVolt  : [
                              [0,0,0]
                            ],
                battPers  : [
                              [0,0,0]
                            ]
              }
};

let dataGrid = [
                  [0,0,0],
                  [0,0,0],
                  [0,0,0]
               ];
let curGridCol = 1;
let curGridRow = 1;

let mapOffsetX = 150;
let mapOffsetY = 450;

let lastDataWall =[];
let frontLong = [];
let rightLong = [];
let leftLong  = [];
let backLong  = [];

let frontShort = [];
let rightShort = [];
let leftShort  = [];
let backShort  = [];

let pointing = 0;

let firstTimeAlignment;
let RTH = 0;

let lineLinear =[];
let angleDiff;

let leftX = [];
let leftY = [];

let pathPlanHeading;
let pathPlanForward;

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

let seqCalibrateMpu = 1;
let seqReadSensor = 0;
let seqPathPlanning = 0;
let seqForward = 0;
let seqHeading = 0;

let waiting = 0;
let cycle = 0; 

window.addEventListener("load", onLoad);

function initWebSocket() {
  console.log("Trying to open a WebSocket connection...");
  websocket = new WebSocket(gateway);
  websocket.onopen    = onOpen;
  websocket.onclose   = onClose;
  websocket.onmessage = onMessage; // <-- add this line

  // DUMMY WALL DATA
  // var lastRobotCorX = dataMap.robotCor[dataMap.robotCor.length-1][0];
  // var lastRobotCorY = dataMap.robotCor[dataMap.robotCor.length-1][1];
  // lastRobotCorX = (scale*lastRobotCorX) + mapOffsetX;
  // lastRobotCorY = -(scale*lastRobotCorY) + mapOffsetY;
  // for(var i = 0; i < 360; i++){
  //   var x = ((sin(i) * 150 * scale) + lastRobotCorX);
  //   var y = ((cos(i) * 150 * scale) + lastRobotCorY);
  //   dataMap.wall.push([x,y]);
  // }
}

function onOpen(event) {
  connectionStatus = "Opened !";
}
function onClose(event) {
  connectionStatus = "Closed !";
  setTimeout(initWebSocket, 5000);
}

function onMessage(event) {
  var lastRobotCorX = dataMap.robotCor[dataMap.robotCor.length-1][0];
  var lastRobotCorY = dataMap.robotCor[dataMap.robotCor.length-1][1];
  lastRobotCorX = (scale*lastRobotCorX) + mapOffsetX;
  lastRobotCorY = -(scale*lastRobotCorY) + mapOffsetY;
  console.log(event.data);
  if(event.data.length > 50){
    var data = JSON.parse(event.data);
    angleMode(RADIANS);
    for (var i=0; i<data.wall.length; i++){
      var a = i - 180;
      a = -a + 180;
      a = (a * 0.0174533);
      var num = parseInt(data.wall[i], 10);
      if (num && num<=450){
        var x = ((sin(a) * num * scale) + lastRobotCorX);
        var y = ((cos(a) * num * scale) + lastRobotCorY);
        dataMap.wall.push([x, y]);
        lastDataWall[i] = num;
      }
      else {
        console.log("DEBUG : Array kosong/error di index #"+i);
      }
    }
    dataMap.gas.voc.push([lastRobotCorX, lastRobotCorY, parseInt(data.gas.voc, 10)]);
    dataMap.gas.co2.push([lastRobotCorX, lastRobotCorY, parseInt(data.gas.co2, 10)]);
    dataMap.gas.smoke.push([lastRobotCorX, lastRobotCorY, parseInt(data.gas.smoke, 10)]);
    dataMap.gas.battVolt.push([lastRobotCorX, lastRobotCorY, parseFloat(data.gas.battVolt).toFixed(2)]);
    dataMap.gas.battPers.push([lastRobotCorX, lastRobotCorY, parseInt(data.gas.battPers, 10)]);
    // let quality = fuzzyLogic(parseInt(data.gas.voc, 10), parseInt(data.gas.co2, 10), parseInt(data.gas.smoke, 10));

    let obj = {
      // crisp_input: [parseInt(data.gas.voc, 10), parseInt(data.gas.co2, 10), parseInt(data.gas.smoke, 10)],
      crisp_input: [100,2000,100],
      variables_input: [
        {
          name: "VOC",
          setsName: ["baik", "sedang", "buruk"],
          sets: [
            [0,0,10,20],
            [10,20,20,30],
            [20,30,40,40]
          ]
        },
        {
          name: "CO2",
          setsName: ["baik", "sedang", "buruk"],
          sets: [
            [0,0,400,700],
            [400,700,700,1000],
            [700,1000,1000,1000]
          ]
        },
        {
          name: "SMOKE",
          setsName: ["baik", "sedang", "buruk"],
          sets: [
            [0,0,10,30],
            [10,30,30,50],
            [30,50,50,50]
          ]
        }
      ],
      variable_output: {
        name: "QUALITY",
        setsName: ["baik", "sedang", "buruk"],
        sets: [
          [0,0,25,50],
          [25,50,50,75],
          [50,75,100,100]
        ]
      },
      inferences: [
        [2,1,0],
        [2,1,0],
        [2,1,0]
      ]
    };
    let fl = new FuzzyLogic();
    console.log(fl.getResult(obj));

    dataMap.gas.quality.push([lastRobotCorX, lastRobotCorY, "baik"]);

    sequence("readsensorcomplete");
    status("readsensorcomplete");
  }
  else {
    sequence(event.data);
    status(event.data);
  }
}

function status(stat){
  switch (stat){
    case (stat = "calibratempucomplete") :
      robotStatus = "MPU Calibrated!";
      break;
    case (stat = "readsensorcomplete") :
      robotStatus = "Read Sensor Complete!";
      break;
    case (stat = "setforwardcomplete") :
      robotStatus = "Set Forward Complete!";
      break;
    case (stat = "setheadingcomplete") :
      robotStatus = "Set Heading Complete!";
      break;
    case (stat = "ROBOT BUSSY") :
      robotStatus = "ROBOT BUSSY!";
      break;
    default :
    break;
  }
}

function sequence(completeCommand){
  switch (completeCommand){
    case (completeCommand = "calibratempucomplete") :
      seqCalibrateMpu = 1;
      seqReadSensor   = 0;
      seqPathPlanning = 0;
      seqForward      = 0;
      seqHeading      = 0;
      waiting = 0;
      break;

    case (completeCommand = "readsensorcomplete") :
      seqCalibrateMpu = 0;
      seqReadSensor   = 1;
      seqPathPlanning = 0;
      seqForward      = 0;
      seqHeading      = 0;
      waiting = 0;
      break;

    case (completeCommand = "setforwardcomplete") :
      seqCalibrateMpu = 0;
      seqReadSensor   = 0;
      seqPathPlanning = 0;
      seqForward      = 1;
      seqHeading      = 0;
      waiting = 0;
      break;

    case (completeCommand = "setheadingcomplete") :
      seqCalibrateMpu = 0;
      seqReadSensor   = 0;
      seqPathPlanning = 0;
      seqForward      = 0;
      seqHeading      = 1;
      waiting = 0;
      break;

    case (completeCommand = "pathplanningcomplete") :
      seqCalibrateMpu = 0;
      seqReadSensor   = 0;
      seqPathPlanning = 1;
      seqForward      = 0;
      seqHeading      = 0;
      waiting = 0;
      break;

    case (completeCommand = "ROBOT BUSSY") :
      seqCalibrateMpu = 0;
      seqReadSensor   = 0;
      seqPathPlanning = 0;
      seqForward      = 0;
      seqHeading      = 0;
      waiting = 1;
      break;

    default :
    break;
  }
}

function onLoad(event) {
  initWebSocket();
  // initButton();
  let a = [
    [0,0,0],
    [0,0,0]
  ];
  // console.log(a.length);
  // console.log(a[0].length);
  for (let i=0; i<a.length; i++ ){
    for(let j=0; j<a[0].length; j++){
      console.log(a[i][j]);
    }
  }
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
    robotStatus = "Calibrating MPU!";
  // } else{
  //   alert("SEDANG MODE AUTO");
  // }
}

function readSensor(){
  // if(mode == 0){
    websocket.send("readsensor");
    robotStatus = "Reading Sensor!";
  // } else{
  //   alert("SEDANG  MODE AUTO");
  // }
}

function setHeading(value){
  if (typeof value === "undefined") {
    value = inputHeading.value();
  }

  if (value !== ""){
    websocket.send("setheading=" + value);
    robotStatus = "Set Heading Running!";
    var lastRobotCorX = dataMap.robotCor[dataMap.robotCor.length-1][0];
    var lastRobotCorY = dataMap.robotCor[dataMap.robotCor.length-1][1];
    var lastRobotCorH = dataMap.robotCor[dataMap.robotCor.length-1][2];

    lastRobotCorH = lastRobotCorH + parseInt(value, 10);
    lastRobotCorH = normalizeAngle(lastRobotCorH);
    dataMap.robotCor.push([lastRobotCorX, lastRobotCorY, lastRobotCorH]);
  }
  else{
    console.log("input heading kosong");
  }
}

function setForward(value){
  if (typeof value === "undefined") {
    value = inputForward.value();
  }

  if (value !== ""){
    websocket.send("setforward=" + value);
    robotStatus = "Set Forward Running!";
    var lastRobotCorX = dataMap.robotCor[dataMap.robotCor.length-1][0];
    var lastRobotCorY = dataMap.robotCor[dataMap.robotCor.length-1][1];
    var lastRobotCorH = dataMap.robotCor[dataMap.robotCor.length-1][2];
    
    angleMode(RADIANS);
    lastRobotCorX = lastRobotCorX + parseInt((sin(lastRobotCorH * 0.0174533) * parseInt(value, 10)),10);
    lastRobotCorY = lastRobotCorY + parseInt((cos(lastRobotCorH * 0.0174533) * parseInt(value, 10)),10);
    dataMap.robotCor.push([lastRobotCorX, lastRobotCorY, lastRobotCorH]);
  }
  else{
    console.log("input forward kosong");
  }
}

function findLineByLeastSquares(values_x, values_y) {
  var sum_x = 0;
  var sum_y = 0;
  var sum_xy = 0;
  var sum_xx = 0;
  var count = 0;

  /*
   * We'll use those variables for faster read/write access.
   */
  var x = 0;
  var y = 0;
  var values_length = values_x.length;

  if (values_length != values_y.length) {
      throw new Error('The parameters values_x and values_y need to have same size!');
  }

  /*
   * Nothing to do.
   */
  if (values_length === 0) {
      return [ [], [] ];
  }

  /*
   * Calculate the sum for each of the parts necessary.
   */
  for (var v = 0; v<values_length; v++) {
      x = values_x[v];
      y = values_y[v];
      sum_x += x;
      sum_y += y;
      sum_xx += x*x;
      sum_xy += x*y;
      count++;
  }

  /*
   * Calculate m and b for the formular:
   * y = x * m + b
   */
  var m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
  var b = (sum_y/count) - (m*sum_x)/count;

  /*
   * We will make the x and y result line now
   */
  var result_values_x = [];
  var result_values_y = [];

  for (var v = 0; v<values_length; v++) {
      x = values_x[v];
      y = x * m + b;
      result_values_x.push(x);
      result_values_y.push(y);
  }

  // return [result_values_x, result_values_y];
  return [m,b];
}

function updateDataGrid(kanan, kiri, depan, belakang, pointing){
  // 0 = tidak tau
  // 1 = belum di scan
  // 2 = sudah discan
  // 8 = tembok

  // column row sekarang sudah discan
  dataGrid[curGridCol][curGridRow] = 2;

  let jarakTerpendekDepan;
  let jarakTerpendekBelakang;
  let jarakTerpendekKanan;
  let jarakTerpendekKiri;

  //pointing
  // 0 = 0 derajat
  // 1 = 90 derajat
  // 2 = 180 derajat
  // 3 = 270 derajat

  switch (pointing){
    case 0 :
      jarakTerpendekDepan     = depan;
      jarakTerpendekBelakang  = belakang;
      jarakTerpendekKanan     = kanan;
      jarakTerpendekKiri      = kiri;
      break;
    case 1 :
      jarakTerpendekDepan     = kiri;
      jarakTerpendekBelakang  = kanan;
      jarakTerpendekKanan     = depan;
      jarakTerpendekKiri      = belakang;
      break;
    case 2 :
      jarakTerpendekDepan     = belakang;
      jarakTerpendekBelakang  = depan;
      jarakTerpendekKanan     = kiri;
      jarakTerpendekKiri      = kanan;
      break;
    case 3 :
      jarakTerpendekDepan     = kanan;
      jarakTerpendekBelakang  = kiri;
      jarakTerpendekKanan     = belakang;
      jarakTerpendekKiri      = depan;
      break;
  }

  // DATA GRID
  // CEK DATA GRID DEPAN
  if (jarakTerpendekDepan < 400){                                                 // terdeteksi tembok
    dataGrid[curGridCol][curGridRow+1] = 8;
  } else{                                                                         // bukan tembok
    if (dataGrid[curGridCol][curGridRow+1] == 2){                                 // jika sudah discan -> 
      dataGrid[curGridCol][curGridRow+1] = dataGrid[curGridCol][curGridRow+1];    // do nothing
    }
    else{                                                                         // jika belum discan
      dataGrid[curGridCol][curGridRow+1] = 1;                                     // masukan data belum discan
    }
  }
  // CEK DATA GRID KIRI
  if (jarakTerpendekKiri < 400){                                                 // terdeteksi tembok
    dataGrid[curGridCol-1][curGridRow] = 8;
  } else{                                                                         // bukan tembok
    if (dataGrid[curGridCol-1][curGridRow] == 2){                                 // jika sudah discan -> 
      dataGrid[curGridCol-1][curGridRow] = dataGrid[curGridCol-1][curGridRow];    // do nothing
    }
    else{                                                                         // jika belum discan
      dataGrid[curGridCol-1][curGridRow] = 1;                                     // masukan data belum discan
    }
  }
  // CEK DATA GRID KANAN
  if (jarakTerpendekKanan < 400){                                                 // terdeteksi tembok
    dataGrid[curGridCol+1][curGridRow] = 8;
  } else{                                                                         // bukan tembok
    if (dataGrid[curGridCol+1][curGridRow] == 2){                                 // jika sudah discan -> 
      dataGrid[curGridCol+1][curGridRow] = dataGrid[curGridCol+1][curGridRow];    // do nothing
    }
    else{                                                                         // jika belum discan
      dataGrid[curGridCol+1][curGridRow] = 1;                                     // masukan data belum discan
    }
  }
  // CEK DATA GRID BELAKANG
  if (jarakTerpendekBelakang < 400){                                                 // terdeteksi tembok
    dataGrid[curGridCol][curGridRow-1] = 8;
  } else{                                                                         // bukan tembok
    if (dataGrid[curGridCol][curGridRow-1] == 2){                                 // jika sudah discan -> 
      dataGrid[curGridCol][curGridRow-1] = dataGrid[curGridCol][curGridRow-1];    // do nothing
    }
    else{                                                                         // jika belum discan
      dataGrid[curGridCol][curGridRow-1] = 1;                                     // masukan data belum discan
    }
  }
}

function normalizePointing(p){
  if (p > 3){
    p = p - 4;
  }
  else if (p < 0){
    p = 4 + p;
  }
  else{
    p=p;
  }
  return p;
}

function pathPlanning(){
  let lastRobotCor = dataMap.robotCor.length-1;
  let lastRobotCorX = dataMap.robotCor[lastRobotCor][0];
  let lastRobotCorY = dataMap.robotCor[lastRobotCor][1];
  let lastRobotCorH = dataMap.robotCor[lastRobotCor][2];

  //value scale to map
  let robotCorX = (lastRobotCorX*scale) + mapOffsetX;
  let robotCorY = -(lastRobotCorY*scale) + mapOffsetY;

  let jarakTerpendekDepan;
  let jarakPerbandinganDepan;
  let jarakTerpendekKanan;
  let jarakPerbandinganKanan;
  let jarakTerpendekKiri;
  let jarakPerbandinganKiri;
  let jarakTerpendekBelakang;
  let jarakPerbandinganBelakang;

  let deadBandLong  = 30;
  let deadBandShort = 10;

  for (let i = -deadBandLong; i<=deadBandLong; i++){
    frontLong[i+deadBandLong] = lastDataWall[normalizeAngle(lastRobotCorH+180+i)];
    rightLong[i+deadBandLong] = lastDataWall[normalizeAngle(lastRobotCorH+270+i)];
    leftLong[i+deadBandLong] = lastDataWall[normalizeAngle(lastRobotCorH+90+i)];
    backLong[i+deadBandLong] = lastDataWall[normalizeAngle(lastRobotCorH+i)];
  }

  for (let i = -deadBandShort; i<=deadBandShort; i++){
    frontShort[i+deadBandShort] = lastDataWall[normalizeAngle(lastRobotCorH+180+i)];
    rightShort[i+deadBandShort] = lastDataWall[normalizeAngle(lastRobotCorH+270+i)];
    leftShort[i+deadBandShort] = lastDataWall[normalizeAngle(lastRobotCorH+90+i)];
    backShort[i+deadBandShort] = lastDataWall[normalizeAngle(lastRobotCorH+i)];
  }

  //KALKULASI JARAK TERPENDEK DEPAN
  for(let i=0; i<frontShort.length; i++){
    jarakTerpendekDepan = frontShort[i];
    jarakPerbandinganDepan = frontShort[i+1];
    if(jarakPerbandinganDepan < jarakTerpendekDepan){
      jarakTerpendekDepan = jarakPerbandinganDepan;
    }
  }

  //KALKULASI JARAK TERPENDEK KANAN
  for(let i=0; i<rightShort.length; i++){
    jarakTerpendekKanan = rightShort[i];
    jarakPerbandinganKanan = rightShort[i+1];
    if(jarakPerbandinganKanan < jarakTerpendekKanan){
      jarakTerpendekKanan = jarakPerbandinganKanan;
    }
  }

  //KALKULASI JARAK TERPENDEK KIRI
  for(let i=0; i<leftShort.length; i++){
    jarakTerpendekKiri = leftShort[i];
    jarakPerbandinganKiri = leftShort[i+1];
    if(jarakPerbandinganKiri < jarakTerpendekKiri){
      jarakTerpendekKiri = jarakPerbandinganKiri;
    }
  }

  //KALKULASI JARAK TERPENDEK BELAKANG
  for(let i=0; i<backShort.length; i++){
    jarakTerpendekBelakang = backShort[i];
    jarakPerbandinganBelakang = backShort[i+1];
    if(jarakPerbandinganBelakang < jarakTerpendekBelakang){
      jarakTerpendekBelakang = jarakPerbandinganBelakang;
    }
  }
  updateDataGrid(jarakTerpendekKanan, jarakTerpendekKiri, jarakTerpendekDepan, jarakTerpendekBelakang, pointing);
  
  console.log(dataGrid);

  // 0 = tidak tau
  // 1 = belum di scan
  // 2 = sudah discan
  // 8 = tembok 

  switch (pointing){
    case 0:
      // CEK DATA GRID YANG TERSEDIA
      if (dataGrid[curGridCol-1][curGridRow] == 1){              // CEK KIRI
        pathPlanHeading = -90;
        pointing = normalizePointing(pointing-1);
        pathPlanForward = 250;
        curGridCol      = curGridCol - 1;
        curGridRow      = curGridRow;
      }
      else{
        if (dataGrid[curGridCol][curGridRow+1] == 1){           // CEK DEPAN
          for (let i=0; i<dataGrid.length; i++){
            dataGrid[i].push(0);
          }
          pathPlanHeading = 0;
          pointing = normalizePointing(pointing);
          pathPlanForward = 250;
          curGridCol = curGridCol;
          curGridRow = curGridRow+1;
        }
        else {                                                // CEK KANAN
          if(dataGrid[curGridCol+1][curGridRow] == 1){
            let dumpArray =[];
          for (let i=0; i<dataGrid[0].length; i++){
            dumpArray.push(0);
          }
          dataGrid.push(dumpArray);
          pathPlanHeading = 90;
          pointing = normalizePointing(pointing+1);
          pathPlanForward = 250;
          curGridCol = curGridCol+1;
          curGridRow = curGridRow;
          }
          //TRAPPED
          
          else {
            let countSpotTersedia = 0;
            for(let col=0; col<dataGrid.length; col++){
              for(let row=0; row<dataGrid[0].length; row++){
                if(dataGrid[col][row] == 1){
                  countSpotTersedia += 1;
                }
              }
            }
            if (countSpotTersedia == 0){
              RTH = 1;
            } else{
              console.log(countSpotTersedia);
            }
          }
        }
      }
      break;

    case 1:
      // CEK DATA GRID YANG TERSEDIA
      if (dataGrid[curGridCol][curGridRow+1] == 1){              // CEK KIRI
        for (let i=0; i<dataGrid.length; i++){
          dataGrid[i].push(0);
        }
        pathPlanHeading = -90;
        pointing = normalizePointing(pointing-1);
        pathPlanForward = 250;
        curGridCol      = curGridCol;
        curGridRow      = curGridRow+1;
      }
      else{
        if (dataGrid[curGridCol][curGridRow-1] == 1){           // CEK KANAN
          let dumpArray =[];
          for (let i=0; i<dataGrid[0].length; i++){
            dumpArray.push(0);
          }
          dataGrid.push(dumpArray);
          pathPlanHeading = 90;
          pointing = normalizePointing(pointing+1);
          pathPlanForward = 250;
          curGridCol = curGridCol;
          curGridRow = curGridRow-1;
        }
        else {                                                // CEK DEPAN
          if (dataGrid[curGridCol][curGridRow+1] == 1){
            pathPlanHeading = 0;
            pointing = normalizePointing(pointing);
            pathPlanForward = 250;
            curGridCol = curGridCol+1;
            curGridRow = curGridRow;
          }
          else {
            let countSpotTersedia = 0;
            for(let col=0; col<dataGrid.length; col++){
              for(let row=0; row<dataGrid[0].length; row++){
                if(dataGrid[col][row] == 1){
                  countSpotTersedia += 1;
                }
              }
            }
            if (countSpotTersedia == 0){
              RTH = 1;
            } else{
              console.log(countSpotTersedia);
            }
          }
        }
      }
      break;
    case 2:
      // CEK DATA GRID YANG TERSEDIA
      if (dataGrid[curGridCol-1][curGridRow] == 1){              // CEK KANAN
        for (let i=0; i<dataGrid.length; i++){
          dataGrid[i].push(0);
        }
        pathPlanHeading = 90;
        pointing = normalizePointing(pointing+1);
        pathPlanForward = 250;
        curGridCol      = curGridCol-1;
        curGridRow      = curGridRow;
      }
      else{
        if (dataGrid[curGridCol][curGridRow-1] == 1){           // CEK DEPAN
          let dumpArray =[];
          for (let i=0; i<dataGrid[0].length; i++){
            dumpArray.push(0);
          }
          dataGrid.push(dumpArray);
          pathPlanHeading = 0;
          pointing = normalizePointing(pointing);
          pathPlanForward = 250;
          curGridCol = curGridCol;
          curGridRow = curGridRow-1;
        }
        else {                                                // CEK KIRI
          if(dataGrid[curGridCol+1][curGridRow] == 1){
            pathPlanHeading = -90;
            pointing = normalizePointing(pointing-1);
            pathPlanForward = 250;
            curGridCol = curGridCol+1;
            curGridRow = curGridRow;
          }
          else {
            let countSpotTersedia = 0;
            for(let col=0; col<dataGrid.length; col++){
              for(let row=0; row<dataGrid[0].length; row++){
                if(dataGrid[col][row] == 1){
                  countSpotTersedia += 1;
                }
              }
            }
            if (countSpotTersedia == 0){
              RTH = 1;
            } else{
              console.log(countSpotTersedia);
            }
          }
        }
      }
      break;
    }
  
  
  // LINEAR REGRESSION
  angleMode(RADIANS);
  stroke(0,255,0);
  strokeWeight(5);
  for (let j=0; j<leftLong.length; j++){
    let a = 90-deadBandLong+j - 180;
    a = -a + 180;
    a = (a * 0.0174533);
    // let a = normalizeAngle(180-i) *0.0174533;
    let x = ((sin(a) * leftLong[j] * scale) + robotCorX);
    let y = ((cos(a) * leftLong[j] * scale) + robotCorY);
    leftX.push(x);
    leftY.push(y);
  }
  lineLinear = findLineByLeastSquares(leftX, leftY);
  console.log(lineLinear);
  console.log(lineLinear.length);

  // function y = x * m + b
  // function x = (y - b) / m
  let m = lineLinear[0];
  let b = lineLinear[1];

  //PYTHAGORAS
  //miring = sqrt(pow(x,2)+pow(y,2))
  let samping = -(robotCorY-100-robotCorY);
  let depan   = -((robotCorY-b)/m - (robotCorY-b-100)/m);
  let miring  = sqrt(pow(samping,2)+pow(depan,2))

  //TRIGONOMETRY
  //SIN (angle) = depan / miring
  let sudut = (asin(depan/miring))*180/Math.PI;
  console.log(sudut);
  
  // pathPlanForward = 100;
  // pathPlanHeading = Math.round(sudut);

  console.log(jarakTerpendekDepan);
  console.log(jarakTerpendekKanan);
  console.log(jarakTerpendekKiri);
  console.log(jarakTerpendekBelakang);

  // BATT PERSENTAGE <40% ABORT ALL PLAN. RTH IMMEDIATELY
  // let lastBattPers = dataMap.gas.battPers[lastDataSensor][2];
  let lastDataSensor = dataMap.gas.battVolt.length-1;
  let lastBattPers = dataMap.gas.battPers[lastDataSensor][2];
  if (lastBattPers <= 40){
    RTH = 1;
  }
  if (RTH == 1){
    let x = lastRobotCorX;
      let y = lastRobotCorY;
      if (x == 0){
        pathPlanHeading = 180;
        pathPlanForward = y;
      } else{
        let path = sqrt(pow(x,2)+ pow(y,2));
        let angle = Math.round((asin(x/path))*180/Math.PI);
        let targetHeading = calculateAngleRemaining(180 + angle);
        
        pathPlanForward = Math.round(path);
        pathPlanHeading = targetHeading;
        console.log(pathPlanHeading);
      }
  }
  sequence("pathplanningcomplete");
}

function calculateAngleRemaining(mpu_target){
  let lastRobotCor = dataMap.robotCor.length-1;
  let lastRobotCorH = dataMap.robotCor[lastRobotCor][2];
  // RUMUS UTAMA
  let angle_remaining = mpu_target - lastRobotCorH;
  // Serial.println(angle_remaining);
  if (angle_remaining > 180){
    angle_remaining = angle_remaining - 360;
  }
  else if (angle_remaining < -180){
    angle_remaining = angle_remaining + 360;
  }
  else {
    angle_remaining = angle_remaining;
  }
  return angle_remaining;
}

function startAuto(){
  mode = 1;
  firstTimeAlignment = 1;
  robotMode = "Automatic";
  RTH = 0;
}

function stopAuto(){
  mode = 0;
  cycle = 0;
  robotMode = "Manual";
}

function returnToHome(){
  RTH = 1;
}


function setup() {
  let canvas = createCanvas(windowWidth - 50, windowHeight -100);
  canvas.position(20, 70);
  frameRate(10); 

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
  buttonHoming.mousePressed(returnToHome);
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

  let lastDataSensor = dataMap.gas.battVolt.length-1;
  let lastBattVolt = dataMap.gas.battVolt[lastDataSensor][2];
  let lastBattPers = dataMap.gas.battPers[lastDataSensor][2];

  //value scale to map
  let robotCorX = (lastRobotCorX*scale) + mapOffsetX;
  let robotCorY = -(lastRobotCorY*scale) + mapOffsetY;

  fill(0);
  textSize(14);
  textStyle(NORMAL);
  text("MANUAL CONTROL", controlSpacer + 70, 50);
  text("AUTO CONTROL", controlSpacer + 70, 300);

  fill(255);
  // noStroke();
  
  text("Connection : " + connectionStatus, 20, 20);
  text("Coordinate (x, y): " + lastRobotCorX + ", " + lastRobotCorY, 200, 20);  // offset from edge 30px
  text("Heading : " + lastRobotCorH, 390, 20);
  text("Battery : " + lastBattVolt +"v | "+lastBattPers+"%", 510, 20);
  text("Robot Status : "+robotMode+" | "+robotStatus, 690, 20);

  // DRAW LAST DATA WALL
  // angleMode(RADIANS);
  // stroke(0,255,0);
  // strokeWeight(5);
  // for(let i = 0; i < lastDataWall.length; i++){
  //   let a = i - 180;
  //   a = -a + 180;
  //   a = (a * 0.0174533);
  //   // let a = normalizeAngle(180-i) *0.0174533;
  //   let x = ((sin(a) * lastDataWall[i] * scale) + robotCorX);
  //   let y = ((cos(a) * lastDataWall[i] * scale) + robotCorY);
  //   if (i <= normalizeAngle(lastRobotCorH+180+10) && i >= normalizeAngle(lastRobotCorH+180-10)){
  //     front.push(lastDataWall[i]);
  //     point(x, y);
  //   }
  //   if (i <= normalizeAngle(lastRobotCorH+90+10) && i >= normalizeAngle(lastRobotCorH+90-10)){
  //     left.push(lastDataWall[i]);
  //     point(x, y);
  //   }
  //   if (i <= normalizeAngle(lastRobotCorH+270+10) && i >= normalizeAngle(lastRobotCorH+270-10)){
  //     right.push(lastDataWall[i]);
  //     point(x, y);
  //   }
  //   if (i <= normalizeAngle(lastRobotCorH+10) && i >= normalizeAngle(lastRobotCorH-10)){
  //     back.push(lastDataWall[i]);
  //     point(x, y);
  //   }
  //   // point(x, y);
  // }

  // DRAW WALL
  stroke(255);
  strokeWeight(2);
  for(var i = 0; i < dataMap.wall.length; i++){
    point(dataMap.wall[i][0], dataMap.wall[i][1]);
  }

  // DRAW GAS
  for (var i = 0; i < dataMap.gas.voc.length; i++){
    if (dataMap.gas.quality[2] = "buruk"){
      stroke(255,0,0);
    }
    else if (dataMap.gas.quality[2] = "sedang"){
      stroke(255,255,0);
    }
    else{
      stroke(0,255,0);
    }
    strokeWeight(10);
    point(dataMap.gas.voc[i][0], dataMap.gas.voc[i][1]);

    noStroke();
    textSize(10);
    text("VOC  : " + dataMap.gas.voc[i][2] + " ppm", dataMap.gas.voc[i][0] + 30, dataMap.gas.voc[i][1] - 30);
    text("CO2  : " + dataMap.gas.co2[i][2] + " ppm", dataMap.gas.co2[i][0] + 30, dataMap.gas.co2[i][1] - 20);
    text("SMOKE: " + dataMap.gas.smoke[i][2] + " ppm", dataMap.gas.smoke[i][0] + 30, dataMap.gas.smoke[i][1] - 10);

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

  //AUTOMATIC LOOP
  if (mode == 1 && waiting == 0){
    // CALIBRATE MPU
    if (cycle == 0){
      waiting = 1;
      cycle = 1;
      console.log("CALIBRATE MPU");
      calibrateMpu();
    }

    // READ SENSOR
    if (seqCalibrateMpu == 1){
      waiting = 1;
      console.log("READ SENSOR");
      readSensor();
    }

    // CEK SEKITAR
    if (seqReadSensor ==  1){
      waiting= 1;
      console.log("PATH PLANNING");
      pathPlanning();

      // let comm = pathPlanning();
      // comm = comm.split("=");
      // if (comm[0].equals("F")){
      //   console.log("SET FORWARD");
      //   // setForward(parseInt(command[1], 10));
      //   setForward(parseInt(comm[1], 10));
      // }
      // if (comm[0].equals("H")){
      //   console.log("SET HEADING");
      //   // setHeading(parseInt(command[1],10));
      //   setHeading(parseInt(comm[1], 10));
      // }
    }
    //FORWARD 
    if (seqPathPlanning == 1){
      waiting=1;
      console.log("SET HEADING");
      setHeading(pathPlanHeading);
    }
    if (seqHeading == 1){
      waiting=1;
      console.log("SET FORWARD");
      setForward(pathPlanForward);
    }
    if (seqForward == 1){
      if (RTH == 1){
        mode = 0;
        cycle = 0;
        robotMode = "Manual";
      }else{
        //next cycle
        cycle = 0;
      }
    }
  }
}