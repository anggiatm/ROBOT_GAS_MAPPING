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

let firstTimeAlignment;
let RTH = 0;

let lineLinear =[];
let angleDiff;

let leftX = [];
let leftY = [];

let pathPlanHeading;
let pathPlanForward;
let missionArray = [];

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
let pointing = 0;

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
  // console.log(event.data);
  if(event.data.length > 50){
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
        if (num <=450){
          dataMap.wall.push([x, y]);
        }
        lastDataWall[i] = num;
      }
      else {
        // console.log("DEBUG : Array kosong/error di index #"+i);
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
    // console.log(fl.getResult(obj));
    let q = "";
    let r = fl.getResult(obj);
    if (r < 33){
      q = "buruk";
    } else if (r>=33 && r<66){
      q = "sedang";
    } else if (r >= 66){
      q = "baik";
    }

    dataMap.gas.quality.push([lastRobotCorX, lastRobotCorY, q]);

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
  // let a = [
  //   [0,0,0],
  //   [0,0,0]
  // ];
  // console.log(a.length);
  // console.log(a[0].length);
  // for (let i=0; i<a.length; i++ ){
  //   for(let j=0; j<a[0].length; j++){
  //     console.log(a[i][j]);
  //   }
  // }
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

function findLineByLeastSquares(valuesX, valuesY) {
  var sumX = 0;
  var sumY = 0;
  var sumXY = 0;
  var sumXX = 0;
  var count = 0;

  var x = 0;
  var y = 0;
  var valuesLength = valuesX.length;

  if (valuesLength != valuesY.length) {
      throw new Error("The parameters valuesX and valuesY need to have same size!");
  }

  if (valuesLength === 0) {
      return [ [], [] ];
  }

  for (let v = 0; v<valuesLength; v++) {
      x = valuesX[v];
      y = valuesY[v];
      sumX += x;
      sumY += y;
      sumXX += x*x;
      sumXY += x*y;
      count++;
  }

  /*
   * Calculate m and b for the formular:
   * y = x * m + b
   */
  var m = (count*sumXY - sumX*sumY) / (count*sumXX - sumX*sumX);
  var b = (sumY/count) - (m*sumX)/count;

  /*
   * We will make the x and y result line now
   */
  var resultValuesX = [];
  var resultValuesY = [];

  for (let w = 0; w<valuesLength; w++) {
      x = valuesX[w];
      y = x * m + b;
      resultValuesX.push(x);
      resultValuesY.push(y);
  }

  // return [resultValuesX, resultValuesY];
  return [m,b];
}

function updateDataGrid(kanan, kiri, depan, belakang, depanKanan, depanKiri, belakangKanan, belakangKiri, p){
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
  let jarakTerpendekDepanKanan;
  let jarakTerpendekDepanKiri;
  let jarakTerpendekBelakangKanan;
  let jarakTerpendekBelakangKiri;

  //pointing
  // 0 = 0 derajat
  // 1 = 90 derajat
  // 2 = 180 derajat
  // 3 = 270 derajat

  switch (p){
    case 0 :
      jarakTerpendekDepan         = depan;
      jarakTerpendekBelakang      = belakang;
      jarakTerpendekKanan         = kanan;
      jarakTerpendekKiri          = kiri;
      jarakTerpendekDepanKanan    = depanKanan;
      jarakTerpendekDepanKiri     = depanKiri;
      jarakTerpendekBelakangKanan = belakangKanan;
      jarakTerpendekBelakangKiri  = belakangKiri;
      break;
    case 1 :
      jarakTerpendekDepan     = kiri;
      jarakTerpendekBelakang  = kanan;
      jarakTerpendekKanan     = depan;
      jarakTerpendekKiri      = belakang;

      jarakTerpendekDepanKanan    = belakangKanan;
      jarakTerpendekDepanKiri     = depanKanan;
      jarakTerpendekBelakangKanan = belakangKiri;
      jarakTerpendekBelakangKiri  = depanKiri;
      break;
    case 2 :
      jarakTerpendekDepan     = belakang;
      jarakTerpendekBelakang  = depan;
      jarakTerpendekKanan     = kiri;
      jarakTerpendekKiri      = kanan;

      jarakTerpendekDepanKanan    = belakangKiri;
      jarakTerpendekDepanKiri     = belakangKanan;
      jarakTerpendekBelakangKanan = depanKiri
      jarakTerpendekBelakangKiri  = depanKanan;
      break;
    case 3 :
      jarakTerpendekDepan     = kanan;
      jarakTerpendekBelakang  = kiri;
      jarakTerpendekKanan     = belakang;
      jarakTerpendekKiri      = depan;

      jarakTerpendekDepanKanan    = depanKiri;
      jarakTerpendekDepanKiri     = belakangKiri;
      jarakTerpendekBelakangKanan = depanKanan;
      jarakTerpendekBelakangKiri  = belakangKanan;
      break;
  }

  // DATA GRID
  // CEK DATA GRID DEPAN
  if (jarakTerpendekDepan < 400 || jarakTerpendekDepanKanan < 220 || jarakTerpendekDepanKiri < 220){                                                 // terdeteksi tembok
    dataGrid[curGridCol][curGridRow+1] = 8;
  } else{                                                                         // bukan tembok
    if (dataGrid[curGridCol][curGridRow+1] === 2){                                 // jika sudah discan -> 
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
    if (dataGrid[curGridCol-1][curGridRow] === 2){                                 // jika sudah discan -> 
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
    if (dataGrid[curGridCol+1][curGridRow] === 2){                                 // jika sudah discan -> 
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
    if (dataGrid[curGridCol][curGridRow-1] === 2){                                 // jika sudah discan -> 
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

function missionPath(){
  let curGridCol = curGridCol;
  let curGridRow = curGridRow;
  switch (pointing){
    case 0:
      break;
    case 1:
      break;
    case 2:
      break;
    case 3:
      break;
  }

  // outuput array path plan forward dan path plan heading
  // berdasarkan berapa column dan berapa row
  // dipikirkan prioritas collumn dulu atau row dulu
  // LIEUR LAH BANGSRIT
  // HARI INI SAMPE SINI DULU LAH ANJI..
}

function pathPlanning(){
  let lastRobotCor = dataMap.robotCor.length-1;
  let lastRobotCorX = dataMap.robotCor[lastRobotCor][0];
  let lastRobotCorY = dataMap.robotCor[lastRobotCor][1];
  let lastRobotCorH = dataMap.robotCor[lastRobotCor][2];

  //value scale to map
  let robotCorX = (lastRobotCorX*scale) + mapOffsetX;
  let robotCorY = -(lastRobotCorY*scale) + mapOffsetY;

  let frontLong = [];
  let rightLong = [];
  let leftLong  = [];
  let backLong  = [];

  let frontShort      = [];
  let frontLeftShort  = [];
  let frontRightShort = [];
  let rightShort      = [];
  let leftShort       = [];
  let backShort       = [];
  let backRightShort  = [];
  let backLeftShort   = [];

  let jarakTerpendekDepan;
  let jarakTerpendekDepanKanan;
  let jarakTerpendekDepanKiri;
  let jarakTerpendekKanan;
  let jarakTerpendekKiri;
  let jarakTerpendekBelakang;
  let jarakTerpendekBelakangKanan;
  let jarakTerpendekBelakangKiri;

  let deadBandLong  = 30;
  let deadBandShort = 10;

  for (let i = -deadBandLong; i<=deadBandLong; i++){
    frontLong[i+deadBandLong] = lastDataWall[normalizeAngle(lastRobotCorH+180+i)];
    rightLong[i+deadBandLong] = lastDataWall[normalizeAngle(lastRobotCorH+270+i)];
    leftLong[i+deadBandLong] = lastDataWall[normalizeAngle(lastRobotCorH+90+i)];
    backLong[i+deadBandLong] = lastDataWall[normalizeAngle(lastRobotCorH+i)];
  }

  for (let i = -deadBandShort; i<=deadBandShort; i++){
    frontShort[i+deadBandShort]      = lastDataWall[normalizeAngle(lastRobotCorH+180+i)];
    frontLeftShort[i+deadBandShort]  = lastDataWall[normalizeAngle(lastRobotCorH+135+i)];
    frontRightShort[i+deadBandShort] = lastDataWall[normalizeAngle(lastRobotCorH+225+i)];
    rightShort[i+deadBandShort]      = lastDataWall[normalizeAngle(lastRobotCorH+270+i)];
    leftShort[i+deadBandShort]       = lastDataWall[normalizeAngle(lastRobotCorH+90+i)];
    backShort[i+deadBandShort]       = lastDataWall[normalizeAngle(lastRobotCorH+i)];
    backRightShort[i+deadBandShort]  = lastDataWall[normalizeAngle(lastRobotCorH+315+i)];
    backLeftShort[i+deadBandShort]   = lastDataWall[normalizeAngle(lastRobotCorH+45+i)];
  }

  
  jarakTerpendekDepan         = Math.min.apply(Math, frontShort);                              // KALKULASI JARAK TERPENDEK DEPAN
  jarakTerpendekDepanKanan    = Math.min.apply(Math, frontRightShort);                         // KALKULASI JARAK TERPENDEK DEPAN KANAN
  jarakTerpendekDepanKiri     = Math.min.apply(Math, frontLeftShort);                          // KALKULASI JARAK TERPENDEK DEPAN KIRI
  jarakTerpendekKanan         = Math.min.apply(Math, rightShort);                              // KALKULASI JARAK TERPENDEK KANAN
  jarakTerpendekKiri          = Math.min.apply(Math, leftShort);                               // KALKULASI JARAK TERPENDEK KIRI
  jarakTerpendekBelakang      = Math.min.apply(Math, backShort);                               // KALKULASI JARAK TERPENDEK BELAKANG
  jarakTerpendekBelakangKanan = Math.min.apply(Math, backRightShort);                               // KALKULASI JARAK TERPENDEK BELAKANG KANAN
  jarakTerpendekBelakangKiri  = Math.min.apply(Math, backLeftShort);                               // KALKULASI JARAK TERPENDEK BELAKANG KIRI

  updateDataGrid(jarakTerpendekKanan, jarakTerpendekKiri, jarakTerpendekDepan, jarakTerpendekBelakang,
    jarakTerpendekDepanKanan, jarakTerpendekDepanKiri, jarakTerpendekBelakangKanan, jarakTerpendekBelakangKiri, pointing);
  
  console.log(dataGrid);

  // 0 = tidak tau
  // 1 = belum di scan
  // 2 = sudah discan
  // 8 = tembok 

  switch (pointing){
    case 0:
      // CEK DATA GRID YANG TERSEDIA
      if (dataGrid[curGridCol-1][curGridRow] === 1){              // CEK KIRI
        pathPlanHeading = -90;
        pointing = normalizePointing(pointing-1);
        pathPlanForward = 250;
        curGridCol      = curGridCol - 1;
        curGridRow      = curGridRow;
      }
      else{
        if (dataGrid[curGridCol][curGridRow+1] === 1){           // CEK DEPAN
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
          if(dataGrid[curGridCol+1][curGridRow] === 1){
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
                if(dataGrid[col][row] === 1){
                  countSpotTersedia += 1;
                }
              }
            }
            if (countSpotTersedia === 0){
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
      if (dataGrid[curGridCol][curGridRow+1] === 1){              // CEK KIRI
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
        if (dataGrid[curGridCol][curGridRow-1] === 1){           // CEK KANAN
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
          if (dataGrid[curGridCol][curGridRow+1] === 1){
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
                if(dataGrid[col][row] === 1){
                  countSpotTersedia += 1;
                }
              }
            }
            if (countSpotTersedia === 0){
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
      if (dataGrid[curGridCol-1][curGridRow] === 1){              // CEK KANAN
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
        if (dataGrid[curGridCol][curGridRow-1] === 1){           // CEK DEPAN
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
          if(dataGrid[curGridCol+1][curGridRow] === 1){
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
                if(dataGrid[col][row] === 1){
                  countSpotTersedia += 1;
                }
              }
            }
            if (countSpotTersedia === 0){
              RTH = 1;
            } else{
              console.log(countSpotTersedia);
            }
          }
        }
      }
      break;
      case 3:
        // CEK DATA GRID YANG TERSEDIA
      if (dataGrid[curGridCol-1][curGridRow] === 1){              // CEK DEPAN
        for (let i=0; i<dataGrid.length; i++){
          dataGrid[i].push(0);
        }
        pathPlanHeading = 0;
        pointing = normalizePointing(pointing);
        pathPlanForward = 250;
        curGridCol      = curGridCol-1;
        curGridRow      = curGridRow;
      }
      else{
        if (dataGrid[curGridCol][curGridRow+1] === 1){           // CEK KANAN
          let dumpArray =[];
          for (let i=0; i<dataGrid[0].length; i++){
            dumpArray.push(0);
          }
          dataGrid.push(dumpArray);
          pathPlanHeading = 90;
          pointing = normalizePointing(pointing+1);
          pathPlanForward = 250;
          curGridCol = curGridCol;
          curGridRow = curGridRow+1;
        }
        else {                                                // CEK KIRI
          if(dataGrid[curGridCol][curGridRow-1] === 1){
            pathPlanHeading = -90;
            pointing = normalizePointing(pointing-1);
            pathPlanForward = 250;
            curGridCol = curGridCol;
            curGridRow = curGridRow-1;
          }
          else {
            let countSpotTersedia = 0;
            for(let col=0; col<dataGrid.length; col++){
              for(let row=0; row<dataGrid[0].length; row++){
                if(dataGrid[col][row] === 1){
                  countSpotTersedia += 1;
                }
              }
            }
            if (countSpotTersedia === 0){
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
  // console.log(lineLinear);
  // console.log(lineLinear.length);

  // function y = x * m + b
  // function x = (y - b) / m
  let m = lineLinear[0];
  let b = lineLinear[1];

  //PYTHAGORAS
  //miring = sqrt(pow(x,2)+pow(y,2))
  let samping = -(robotCorY-100-robotCorY);
  let depan   = -((robotCorY-b)/m - (robotCorY-b-100)/m);
  let miring  = sqrt(pow(samping,2)+pow(depan,2));

  //TRIGONOMETRY
  //SIN (angle) = depan / miring
  let sudut = (asin(depan/miring))*180/Math.PI;
  // console.log(sudut);
  
  // pathPlanForward = 100;
  // pathPlanHeading = Math.round(sudut);

  // console.log(jarakTerpendekDepan);
  // console.log(jarakTerpendekKanan);
  // console.log(jarakTerpendekKiri);
  // console.log(jarakTerpendekBelakang);

  // BATT PERSENTAGE <40% ABORT ALL PLAN. RTH IMMEDIATELY
  // let lastBattPers = dataMap.gas.battPers[lastDataSensor][2];
  let lastDataSensor = dataMap.gas.battVolt.length-1;
  let lastBattPers = dataMap.gas.battPers[lastDataSensor][2];
  if (lastBattPers <= 40){
    RTH = 1;
  }
  if (RTH === 1){
    let x = lastRobotCorX;
      let y = lastRobotCorY;
      if (x === 0){
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
  console.log(pointing);
  sequence("pathplanningcomplete");
}

function calculateAngleRemaining(mpuTarget){
  let lastRobotCor = dataMap.robotCor.length-1;
  let lastRobotCorH = dataMap.robotCor[lastRobotCor][2];
  // RUMUS UTAMA
  let angleRemaining = mpuTarget - lastRobotCorH;
  // Serial.println(angleRemaining);
  if (angleRemaining > 180){
    angleRemaining = angleRemaining - 360;
  }
  else if (angleRemaining < -180){
    angleRemaining = angleRemaining + 360;
  }
  else {
    angleRemaining = angleRemaining;
  }
  return angleRemaining;
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
  for(let q = 0; q < dataMap.wall.length; q++){
    point(dataMap.wall[q][0], dataMap.wall[q][1]);
  }

  // DRAW GAS
  for (let r = 0; r < dataMap.gas.voc.length; r++){
    if (dataMap.gas.quality[r][2] === "buruk"){
      stroke(255,0,0);
    }
    else if (dataMap.gas.quality[r][2] === "sedang"){
      stroke(255,255,0);
    }
    else{
      stroke(0,255,0);
    }
    strokeWeight(10);
    point(dataMap.gas.voc[r][0], dataMap.gas.voc[r][1]);

    noStroke();
    textSize(10);
    text("VOC  : " + dataMap.gas.voc[r][2] + " ppm", dataMap.gas.voc[r][0] + 30, dataMap.gas.voc[r][1] - 30);
    text("CO2  : " + dataMap.gas.co2[r][2] + " ppm", dataMap.gas.co2[r][0] + 30, dataMap.gas.co2[r][1] - 20);
    text("SMOKE: " + dataMap.gas.smoke[r][2] + " ppm", dataMap.gas.smoke[r][0] + 30, dataMap.gas.smoke[r][1] - 10);

    stroke(255);
    strokeWeight(1);
    line(dataMap.gas.voc[r][0] + 5, dataMap.gas.voc[r][1] - 5, dataMap.gas.voc[r][0] + 30, dataMap.gas.voc[r][1] - 30);
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
  if (mode === 1 && waiting === 0){
    // CALIBRATE MPU
    if (cycle === 0){
      waiting = 1;
      cycle = 1;
      console.log("CALIBRATE MPU");
      calibrateMpu();
    }

    // READ SENSOR
    if (seqCalibrateMpu === 1){
      waiting = 1;
      console.log("READ SENSOR");
      readSensor();
    }

    // CEK SEKITAR
    if (seqReadSensor ===  1){
      waiting= 1;
      console.log("PATH PLANNING");
      pathPlanning();
    }

    //FORWARD 
    if (seqPathPlanning === 1){
      waiting=1;
      console.log("SET HEADING");
      setHeading(pathPlanHeading);
    }
    if (seqHeading === 1){
      waiting=1;
      console.log("SET FORWARD");
      setForward(pathPlanForward);
    }
    if (seqForward === 1){
      if (RTH === 1){
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