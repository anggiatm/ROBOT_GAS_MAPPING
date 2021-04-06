//var gateway = `ws://${window.location.hostname}/ws`;
var gateway = `ws://192.168.43.27/ws`;
var websocket;

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
