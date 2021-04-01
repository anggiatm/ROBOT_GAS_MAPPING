// Import required libraries
#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>

/*Example sketch to control a stepper motor with A4988 stepper motor driver, AccelStepper library and Arduino: acceleration and deceleration. More info: https://www.makerguides.com */
// Include the AccelStepper library:
#include <AccelStepper.h>
// Define stepper motor connections and motor interface type. Motor interface type must be set to 1 when using a driver:
#define DIR_R 32
#define STEP_R 33

#define DIR_L 25
#define STEP_L 26


// Create a new instance of the AccelStepper class:

AccelStepper STEPPER_R(AccelStepper::DRIVER, STEP_R, DIR_R);
AccelStepper STEPPER_L(AccelStepper::DRIVER, STEP_L, DIR_L);

// Replace with your network credentials
const char* ssid = "MIX";
const char* password = "123456789";

bool ledState = 0;
const int ledPin = 2;
int x=1;
int mode = 1;

// Create AsyncWebServer object on port 80
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

void notifyClients() {
  ws.textAll(String(ledState));
}

void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    if (strcmp((char*)data, "toggle") == 0) {
      ledState = !ledState;
      notifyClients();
    }
  }
}

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type,
             void *arg, uint8_t *data, size_t len) {
    switch (type) {
      case WS_EVT_CONNECT:
        Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
        break;
      case WS_EVT_DISCONNECT:
        Serial.printf("WebSocket client #%u disconnected\n", client->id());
        break;
      case WS_EVT_DATA:
        handleWebSocketMessage(arg, data, len);
        break;
      case WS_EVT_PONG:
      case WS_EVT_ERROR:
        break;
  }
}

void initWebSocket() {
  ws.onEvent(onEvent);
  server.addHandler(&ws);
}

String processor(const String& var){
  Serial.println(var);
  if(var == "STATE"){
    if (ledState){
      return "ON";
    }
    else{
      return "OFF";
    }
  }
}

bool FORWARD(int value){
  STEPPER_R.moveTo(value);
  if (STEPPER_R.distanceToGo() == 0){
    return true;
  }else{
    return false;
  }
}

bool BACKWARD(int value){
   if (STEPPER_R.currentPosition() != value){
    STEPPER_R.moveTo(value - STEPPER_R.currentPosition());
    STEPPER_L.moveTo(value - STEPPER_L.currentPosition());
    STEPPER_R.run();
    STEPPER_L.run();
    return false;
  }else{
    return true;
  }
}

bool ROTATE_R(int value){
  STEPPER_R.moveTo(STEPPER_R.currentPosition()+value);
  STEPPER_L.moveTo(STEPPER_L.currentPosition()-value);
}

bool ROTATE_L(int value){
  STEPPER_R.moveTo(STEPPER_R.currentPosition()-value);
  STEPPER_L.moveTo(STEPPER_L.currentPosition()+value);
}

void setup(){
  // Serial port for debugging purposes
  Serial.begin(115200);

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);

  STEPPER_R.setMaxSpeed(400.0);
  STEPPER_R.setAcceleration(150.0);
  STEPPER_L.setPinsInverted (false, false, false); // (bool directionInvert=false, bool stepInvert=false, bool enableInvert=false)
  //STEPPER_R.moveTo(800);
    
  STEPPER_L.setMaxSpeed(400.0);
  STEPPER_L.setAcceleration(150.0);
  STEPPER_L.setPinsInverted (true, false, false); // (bool directionInvert=false, bool stepInvert=false, bool enableInvert=false)
  //STEPPER_L.moveTo(800);

  // Initialize SPIFFS
  if(!SPIFFS.begin()){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }
  
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }

  // Print ESP Local IP Address
  Serial.println(WiFi.localIP());

  initWebSocket();

  // Route for root / web page
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/index.html", String(), false, processor);
  });

  // Route to load style.css file
  server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/style.css", "text/css");
  });

  // Route to load p5.min.js file
  server.on("/p5.min.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/p5.min.js", "text/javascript");
  });

  // Route to load map_js.js file
  server.on("/map_js.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/map_js.js", "text/javascript");
  });

  // Start server
  server.begin();
}

void loop() {
  ws.cleanupClients();
  digitalWrite(ledPin, ledState);
  x=x+1;
  ws.textAll(String(x));
  //delay(1000);

  // Change direction at the limits
  //   if (STEPPER_R.distanceToGo() == 0){
  //     STEPPER_R.moveTo(-STEPPER_R.currentPosition());
  //   }
	
  //int move = 800;
  if (mode == 1){
    //int value = 800;
    STEPPER_R.moveTo(800);
    STEPPER_L.moveTo(800);
    if (STEPPER_L.distanceToGo() == 0){
      STEPPER_R.setCurrentPosition(0);
    STEPPER_L.setCurrentPosition(0);
      mode = 2;
    }else{
      mode = 1;
    }
  }else if(mode == 2){
    

    STEPPER_R.moveTo(-800);
    STEPPER_L.moveTo(-800);
    if (STEPPER_L.distanceToGo() == 0){
      STEPPER_R.setCurrentPosition(0);
    STEPPER_L.setCurrentPosition(0);
      mode = 3;
    }else{
      mode = 2;
    }
  }else if(mode == 3){

    STEPPER_R.moveTo(800);
    STEPPER_L.moveTo(-800);
    if (STEPPER_L.distanceToGo() == 0){
      STEPPER_R.setCurrentPosition(0);
    STEPPER_L.setCurrentPosition(0);
      mode = 1;
    }else{
      mode = 3;
    }
  }
  
    

  STEPPER_R.run();
  STEPPER_L.run();
}

