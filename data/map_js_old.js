var ledOn = false;
var gateway = `ws://${window.location.hostname}/ws`;
var websocket;

function setup() {
  // Sets the screen to be 720 pixels wide and 400 pixels high
  createCanvas(720, 400);
  initWebSocket();
}

function draw() {
  // Set the background to black and turn off the fill color
  background(0);
  noFill();

  stroke(255);
  point(width * 0.5, height * 0.5);
  point(width * 0.5, height * 0.25);
}

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
    print(event.data, 20, 20);
    document.getElementById('state').innerHTML = event.data;
  }
  window.addEventListener('load', onLoad);
  function onLoad(event) {
    initWebSocket();
    initButton();
  }

  function initButton() {
    document.getElementById('button').addEventListener('click', toggle);
  }
  function toggle(){
    websocket.send('toggle');
  }
