
#include <Arduino.h>
//WIFI
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>

#include <steps.h>
#include <navigation.h>
#include <heading.h>
#include <coordinate.h>


//#include <math.h>
//#define _USE_MATH_DEFINES



#define DIR_R 32
#define STEP_R 33

#define DIR_L 25
#define STEP_L 26


STEPS step;
HEADING head;
COORDINATE c;
NAVIGATION N;


// Replace with your network credentials
const char* ssid = "MIX";
const char* password = "123456789";

bool ledState = 0;
const int ledPin = 2;
int obstacle=1;

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


void setup(){
  Serial.begin(115200);
  // Initialize SPIFFS
  if(!SPIFFS.begin()){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }

  step.initStepper();
  head.initHeading();


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
  c.setCoordinate(0,0);
  c.setHeading(0);
}

void loop() {
  ws.cleanupClients();
  //digitalWrite(ledPin, ledState);
  obstacle=obstacle+1;
  ws.textAll(String(obstacle));
  
  N.navigation(100,100);

}