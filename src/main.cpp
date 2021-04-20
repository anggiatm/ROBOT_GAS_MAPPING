

/*****************************************************************************************************************************
 * KALKULASI SUDUT PUTAR ROBOT / STEP PER MM
 * -------------------------------------------------------------------------------------------------------------------------
 * DIAMETER RODA (OD)                     : 70MM
 * DIAMETER JARAK RODA KANAN & RODA KIRI  : 95MM
 * SPEK STEPPER MOTOR                     : 1.8deg/Step = 200 STEP PER REVOLUTION
 * MICROSTEPPING                          : 1/4
 * MICROSTEPPING FULL ROTATION            : 200 * 4 = 800 STEP PER REVOLUTION
 * RUMUS KELILING LIINGKARAN              : K = π * d
 * ---------------------------------------------------------------------------------------------------------------------------
 * PANJANG KELILING RODA                  : π * 70 = 219.91148575128552669238503682957 MM
 * 
 * STEP PER MM BERDASARKAN KELILING RODA  : MICROSTEPPING FULL ROTATION / PANJANG KELILING RODA
 *                                          = 800 / 219.91148575128552669238503682957
 *                                            3.6378272706718933890030574485145 STEPS PER MM
 * ---------------------------------------------------------------------------------------------------------------------------
 * KELILING DIAMETER RODA KANAN & KIRI    : π x 95 = 298.45130209103035765395112141155 MM
 * FULL ROBOT SPIN (360deg) IN STEPS      : KELILING DIAMETER RODA KANAN & KIRI * STEP PER MM BERDASARKAN KELILING RODA
 *                                          = 298.45130209103035765395112141155 * 3.6378272706718933890030574485145
 *                                          = 1,085.7142857142857142857142857143 STEPS
 * STEP PER DEGREE ROBOT ROTATION         : FULL ROBOT SPIN (360deg) IN STEPS / 360deg
 *                                          = 1,085.7142857142857142857142857143 / 360
 *                                          = 3.0158730158730158730158730158729 STEP PER DEGREE
 * 
 * MM PER DEGREE ROBOT SPIN               : KELILING DIAMETER RODA KANAN & KIRI / 360
 *                                          = 298.45130209103035765395112141155 / 360
 *                                          = 0.82903139469730654903875311503208 MM PER DEGREE
 * 
********************************************************************************************************************************/

/*** KALKULASI & OPTIMASI RAM **
 * TOTAL RAM      : 327680 byte
 * 
 * TASK
 * 
 * */

#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
#include <ESP_FlexyStepper.h>
#include <driver/i2c.h>
#include <esp_log.h>
#include <esp_err.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include "MPU6050.h"
#include "MPU6050_6Axis_MotionApps20.h"
#include "sdkconfig.h"

#define PIN_SDA 21
#define PIN_CLK 22

#ifndef M_PI
    #define M_PI 3.14159265358979323846
#endif

#define STEP_PER_MM 3.637827270671893389
//#define MM_PER_DEGREE 0.82903139469730654904   //95mm Diameter
#define MM_PER_DEGREE 0.84648468721724984481     //97mm Diameter

#define DIR_R 32
#define STEP_R 33
#define DIR_L 25
#define STEP_L 26

#define SPEED_MM_PER_SECOND 35
#define ACCELERATION_MM_PER_SECOND 140
#define DECELERATION_MM_PER_SECOND 140

//#define MM_PER_DEGREE 0.82903139469730654904

//NAVIGATION nav;
//COORDINATE cor;
//HEADING head;
ESP_FlexyStepper MOTOR_R;
ESP_FlexyStepper MOTOR_L;

//TaskHandle_t MPU_TaskInit_Handle;
//TaskHandle_t MPU_TaskRun_Handle;
TaskHandle_t Client_Task_Handle;

// Quaternion q;           // [w, x, y, z]         quaternion container
// VectorFloat gravity;    // [x, y, z]            gravity vector
// float ypr[3];           // [yaw, pitch, roll]   yaw/pitch/roll container and gravity vector
// uint16_t packetSize = 42;    // expected DMP packet size (default is 42 bytes)
// uint16_t fifoCount;     // count of all bytes currently in FIFO
// uint8_t fifoBuffer[64]; // FIFO storage buffer
// uint8_t mpuIntStatus;   // holds actual interrupt status byte from MPU

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

void forward(int target){
  MOTOR_R.setCurrentPositionInMillimeters(0);
  MOTOR_L.setCurrentPositionInMillimeters(0);
  MOTOR_R.setTargetPositionInMillimeters(target);
  MOTOR_L.setTargetPositionInMillimeters(target);
}

void setHeading(int value){
  float target = value*MM_PER_DEGREE;
  MOTOR_R.setCurrentPositionInMillimeters(0);
  MOTOR_L.setCurrentPositionInMillimeters(0);
  MOTOR_R.setTargetPositionInMillimeters(-target);
  MOTOR_L.setTargetPositionInMillimeters(target);
}

void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    String command = splitString((char*)data, '=', 0);
    String value = splitString((char*)data, '=', 1);

    if (command == "setheading"){
      //vTaskSuspend(MPU_TaskRun_Handle);
      Serial.println("SET HEADING");
      int val_head = value.toInt();
      setHeading(val_head);
    }
    
    else if (command == "setforward"){
      Serial.println("SET FORWARD");
      int val_forward = value.toInt();
      forward(val_forward);
      //clearPosition();
      //sendHeading();
    }

    else if (command == "readsensor"){
      Serial.println("READ SENSOR");
      //clearPosition();
      //sendHeading();
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

// void task_display(void*){
// 	MPU6050 mpu = MPU6050();
// 	mpu.initialize();
// 	mpu.dmpInitialize();
// 	// This need to be setup individually
// 	mpu.setXGyroOffset(220);
// 	mpu.setYGyroOffset(76);
// 	mpu.setZGyroOffset(-85);
// 	mpu.setZAccelOffset(1788);
// 	mpu.setDMPEnabled(true);

// 	while(1){
//     mpuIntStatus = mpu.getIntStatus();
// 		fifoCount = mpu.getFIFOCount();
//     if ((mpuIntStatus & 0x10) || fifoCount == 1024) {
//       mpu.resetFIFO();
// 	  }
//     else if (mpuIntStatus & 0x02) {
//       // wait for correct available data length, should be a VERY short wait
//       while (fifoCount < packetSize) fifoCount = mpu.getFIFOCount();
//       mpu.getFIFOBytes(fifoBuffer, packetSize);
// 	 		mpu.dmpGetQuaternion(&q, fifoBuffer);
// 			mpu.dmpGetGravity(&gravity, &q);
// 			mpu.dmpGetYawPitchRoll(ypr, &q, &gravity);
// 			printf("\n YAW:", ypr[0] * 180/M_PI);
// 	  }
// 		//vTaskDelay(100/portTICK_PERIOD_MS);
// 	}
// 	vTaskDelete(NULL);
// }

// void task_initI2C(void *ignore) {
// 	i2c_config_t conf;
// 	conf.mode = I2C_MODE_MASTER;
// 	conf.sda_io_num = (gpio_num_t)PIN_SDA;
// 	conf.scl_io_num = (gpio_num_t)PIN_CLK;
// 	conf.sda_pullup_en = GPIO_PULLUP_ENABLE;
// 	conf.scl_pullup_en = GPIO_PULLUP_ENABLE;
// 	conf.master.clk_speed = 400000;
// 	ESP_ERROR_CHECK(i2c_param_config(I2C_NUM_0, &conf));
// 	ESP_ERROR_CHECK(i2c_driver_install(I2C_NUM_0, I2C_MODE_MASTER, 0, 0, 0));
// 	vTaskDelete(NULL);
// }

void task_web_client(void*){
	while(1){
    ws.cleanupClients();
    //digitalWrite(ledPin, ledState);
  }
}

void setup(){
  Serial.begin(115200);
  if(!SPIFFS.begin(true)){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }

  MOTOR_R.connectToPins(STEP_R, DIR_R);
  MOTOR_L.connectToPins(STEP_L, DIR_L);
  MOTOR_R.setStepsPerMillimeter(STEP_PER_MM);
  MOTOR_L.setStepsPerMillimeter(STEP_PER_MM);
  MOTOR_R.setSpeedInMillimetersPerSecond(SPEED_MM_PER_SECOND);
  MOTOR_L.setSpeedInMillimetersPerSecond(SPEED_MM_PER_SECOND);
  //MOTOR_R.setAccelerationInMillimetersPerSecondPerSecond(ACCELERATION_MM_PER_SECOND);
  //MOTOR_L.setDecelerationInMillimetersPerSecondPerSecond(DECELERATION_MM_PER_SECOND);

  pinMode(ledPin, OUTPUT);
  
  
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

  MOTOR_R.startAsService();
  MOTOR_L.startAsService();
  //xTaskCreate(task_initI2C, "MPU_INIT_TASK", 2048, NULL, 1, &MPU_TaskInit_Handle);
  //xTaskCreate(task_display, "MPU_RUN_TASK", 8192, NULL, 1, &MPU_TaskRun_Handle);
  server.begin();
  xTaskCreate(task_web_client, "WEB_CLIENT_TASK", 1024, NULL, 1, &Client_Task_Handle);
  digitalWrite(ledPin, HIGH);
  
}

void loop() {
  //ws.cleanupClients();
}