

/*****************************************************************************************************************************
 * KALKULASI SUDUT PUTAR ROBOT / STEP PER MM
 * -------------------------------------------------------------------------------------------------------------------------
 * DIAMETER RODA (OD)                     : 50MM
 * DIAMETER JARAK RODA KANAN & RODA KIRI  : 95MM
 * SPEK STEPPER MOTOR                     : 1.8deg/Step = 200 STEP PER REVOLUTION
 * MICROSTEPPING                          : 1/4
 * MICROSTEPPING FULL ROTATION            : 200 * 4 = 800 STEP PER REVOLUTION
 * RUMUS KELILING LIINGKARAN              : K = π * d
 * ---------------------------------------------------------------------------------------------------------------------------
 * PANJANG KELILING RODA                  : π * 50 = 157.07963267948966192313216916398 MM
 * 
 * STEP PER MM BERDASARKAN KELILING RODA  : MICROSTEPPING FULL ROTATION / PANJANG KELILING RODA
 *                                          = 800 / 157.07963267948966192313216916398
 *                                            5.0929581789406507446042804279203 STEPS PER MM
 * ---------------------------------------------------------------------------------------------------------------------------
 * KELILING DIAMETER RODA KANAN & KIRI    : π x 95 = 298.45130209103035765395112141155 MM
 * FULL ROBOT SPIN (360deg) IN STEPS      : KELILING DIAMETER RODA KANAN & KIRI * STEP PER MM BERDASARKAN KELILING RODA
 *                                          = 298.45130209103035765395112141155 * 5.0929581789406507446042804279203
 *                                          = 1520 STEPS
 * STEP PER DEGREE ROBOT ROTATION         : FULL ROBOT SPIN (360deg) IN STEPS / 360deg
 *                                          = 1520 / 360
 *                                          = 4.2222222222222222222222222222 STEP PER DEGREE
 * 
 * MM PER DEGREE SROBOT SPIN              : KELILING DIAMETER RODA KANAN & KIRI / 360
 *                                          = 298.45130209103035765395112141155 / 360
 *                                          = 0.82903139469730654903875311503208 MM PER DEGREE
 * 
********************************************************************************************************************************/


#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
#include <ESP_FlexyStepper.h>
#include "navigation.h"
#include "coordinate.h"
#include "heading.h"
//#include "steps.h"

#ifndef M_PI
    #define M_PI 3.14159265358979323846
#endif

#define STEP_PER_MM 5.09295817894065074460
#define MM_PER_DEGREE 0.5330382858376184

//#define MM_PER_DEGREE 0.82903139469730654904

NAVIGATION nav;
COORDINATE cor;
HEADING head;
//STEPS step;

const int DIR_R = 32;
const int STEP_R = 33;
const int DIR_L = 25;
const int STEP_L = 26;

// Speed settings
const float SPEED_MM_PER_SECOND = 70;
const float ACCELERATION_MM_PER_SECOND = 70;
const float DECELERATION_MM_PER_SECOND = 70;


// create the stepper motor object
ESP_FlexyStepper MOTOR_R;
ESP_FlexyStepper MOTOR_L;

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

void setHeading(int value){
  float target = MM_PER_DEGREE*value;
  MOTOR_R.setTargetPositionRelativeInMillimeters(target - MOTOR_R.getCurrentPositionInMillimeters());
  MOTOR_L.setTargetPositionRelativeInMillimeters(target - MOTOR_L.getCurrentPositionInMillimeters());
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
      setHeading(val);
      //step.moveHeading(val);
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
  //step.initStepper();
  cor.initCoordinate();

  if(!SPIFFS.begin(true)){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }

  MOTOR_R.connectToPins(STEP_R, DIR_R);
  MOTOR_L.connectToPins(STEP_L, DIR_L);
  // set the speed and acceleration rates for the stepper motor
  MOTOR_R.setStepsPerMillimeter(STEP_PER_MM);
  MOTOR_L.setStepsPerMillimeter(STEP_PER_MM);

  MOTOR_R.setSpeedInMillimetersPerSecond(SPEED_MM_PER_SECOND);
  MOTOR_L.setSpeedInMillimetersPerSecond(SPEED_MM_PER_SECOND);

  MOTOR_R.setAccelerationInMillimetersPerSecondPerSecond(ACCELERATION_MM_PER_SECOND);
  MOTOR_L.setDecelerationInMillimetersPerSecondPerSecond(DECELERATION_MM_PER_SECOND);
  // Not start the stepper instance as a service in the "background" as a separate task
  // and the OS of the ESP will take care of invoking the processMovement() task regularily so you can do whatever you want in the loop function
 
  
  MOTOR_R.startAsService();
  MOTOR_L.startAsService();

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
  //vTaskDelay(10);
}