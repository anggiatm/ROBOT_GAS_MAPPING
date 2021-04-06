/*********
  Rui Santos
  Complete project details at https://RandomNerdTutorials.com/esp32-websocket-server-arduino/
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
*********/

// Import required libraries

//#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include "SPIFFS.h"
#include "navigation.h"
#include "coordinate.h"
#include "heading.h"
#include "steps.h"

NAVIGATION nav;
COORDINATE cor;
HEADING head;
STEPS step;

// Replace with your network credentials
const char* ssid = "MIX";
const char* password = "123456789";

bool ledState = 0;
const int ledPin = 2;

// Create AsyncWebServer object on port 80
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");


String splitString(String data, char separator, int index){
  int found = 0;
  int strIndex[] = {0, -1};
  int maxIndex = data.length()-1;

  for(int i=0; i<=maxIndex && found<=index; i++){
    if(data.charAt(i)==separator || i==maxIndex){
        found++;
        strIndex[0] = strIndex[1]+1;
        strIndex[1] = (i == maxIndex) ? i+1 : i;
    }
  }
  return found>index ? data.substring(strIndex[0], strIndex[1]) : "";
}

void notifyClients() {
  ws.textAll(String(ledState));
}

void sendHeading(){
  ws.textAll(String("heading-value"));
}

void sendCoordinate(){
  ws.textAll(String("coordinate-value-x,y"));
}

void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    String command = splitString((char*)data, '=', 0);
    String value = splitString((char*)data, '=', 1);
    //Serial.println(command);
    //Serial.println(value);
    if (command == "setheading"){
      Serial.println("SET HEADING");
      int val = value.toInt();
      nav.heading(val);
    }
    
    else if (command == "getheading"){
      Serial.println("GET HEADING");
      sendHeading();
    }
    
    else if (command == "setcoordinate"){
      Serial.println("SET COORDINATE");
      int x = (splitString(value, ',', 0)).toInt();
      int y = (splitString(value, ',', 1)).toInt();
      Serial.println(x);
      Serial.println(y);
    }
    
    else if (command == "getcoordinate"){
      Serial.println("GET COORDINATE");
      sendCoordinate();
    }
    
    else {
      Serial.println("UNKNOWN COMMAND");
    }

    // if (strcmp((char*)data, "toggle") == 0) {
    //   ledState = !ledState;
    //   notifyClients();
    // }
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
  // Serial port for debugging purposes
  Serial.begin(115200);
  head.initHeading();
  step.initStepper();
  cor.initCoordinate();

  if(!SPIFFS.begin(true)){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }

  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);
  
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

  server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/style.css");
  });

  server.on("/websocket.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/websocket.js");
  });

  // Start server
  server.begin();
}

void loop() {
  ws.cleanupClients();
  digitalWrite(ledPin, ledState);
  vTaskDelay(10);
}