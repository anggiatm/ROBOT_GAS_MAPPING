

/*****************************************************************************************************************************
 * ----------------------------- KALKULASI SUDUT PUTAR ROBOT / STEP PER MM ----------------------------------------------------
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

/**
 * LIST TASK
 * TASK 1 MOTOR R
 * TASK 2 MOTOR L
*/

#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
#include <ESP_FlexyStepper.h>
// #include "Arduino_FreeRTOS.h"
// #include <driver/i2c.h>
// #include <esp_log.h>
// #include <esp_err.h>
// #include <freertos/FreeRTOS.h>
// #include <freertos/task.h>
#include "MPU6050_6Axis_MotionApps20.h"
// #include "sdkconfig.h"
#include <VL53L0X.h>
#include <ESP32Servo.h>
#include <ArduinoJSON.h>

#if I2CDEV_IMPLEMENTATION == I2CDEV_ARDUINO_WIRE
    #include "Wire.h"
#endif

#ifndef M_PI
    #define M_PI 3.14159265358979323846
#endif

#define INTERRUPT_PIN 5
#define OUTPUT_READABLE_YAWPITCHROLL

//#define PIN_SDA 21
//#define PIN_SCL 22

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

#define SERVO_NEUTRAL 99
#define SERVO_RUN_CW 91
#define SERVO_RUN_ALIGNMENT 96

#define HALL_SENSOR 19  // INVERTED !!! || ON = 0 || OFF = 1
#define LED 2

//#define MM_PER_DEGREE 0.82903139469730654904

ESP_FlexyStepper MOTOR_R;
ESP_FlexyStepper MOTOR_L;

//TaskHandle_t MPU_TaskInit_Handle;
TaskHandle_t MPU_TaskRun_Handle;
TaskHandle_t Client_Task_Handle;

VL53L0X sensor;
Servo motor;
MPU6050 mpu;

// StaticJsonDocument<9216> doc;
DynamicJsonDocument doc(9216); // fixed size 9216
JsonObject root = doc.to<JsonObject>();
char buffer[9216]; // create temp buffer

bool dmpReady = false;
uint8_t mpuIntStatus;   // holds actual interrupt status byte from MPU
uint8_t devStatus;
uint16_t packetSize;
uint16_t fifoCount;     // count of all bytes currently in FIFO
uint8_t fifoBuffer[64]; // FIFO storage buffer

int angle;
int angle_old = 0;
uint16_t count;
bool hall_detect;

Quaternion q;           // [w, x, y, z]         quaternion container
VectorFloat gravity;    // [x, y, z]            gravity vector
float ypr[3];           // [yaw, pitch, roll]   yaw/pitch/roll container and gravity vector

const char* ssid = "MIX";
const char* password = "123456789";

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
  ws.textAll(String("ledState"));
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

int getAngle(){
    int mapa;
    mpu.dmpGetCurrentFIFOPacket(fifoBuffer);
    mpu.dmpGetQuaternion(&q, fifoBuffer);
    mpu.dmpGetGravity(&gravity, &q);
    mpu.dmpGetYawPitchRoll(ypr, &q, &gravity);
    int raw = (ypr[0] * 57.2958)+180;
    if (raw<=180){
        mapa = map(raw, 180, 0, 0, 180);
    }
    else {
        mapa = map(raw, 359, 181, 181, 359);
    }
    return mapa;
}

void scanWall(){
  count = 0;
  int hall = 0;
  int old_hall = 0;

  motor.write(SERVO_RUN_CW);
  while (count <= 1){
    hall = digitalRead(HALL_SENSOR);
      if (hall != old_hall){
        old_hall = hall;
        count = count + 1;
      }
    angle = getAngle();
    if (angle != angle_old){
      root["a"+String(angle)] = sensor.readRangeSingleMillimeters();
      angle_old = angle;

      Serial.println(angle);

      
      // Serial.print(",");
      // Serial.println(sensor.readRangeSingleMillimeters());
      
      // count = count + 1;
      // hall_detect = digitalRead(HALL_SENSOR);
    }
  }
  motor.write(SERVO_NEUTRAL);
  root["voc"] = 0.0;
  root["co2"] = 0.0;
  root["asap"] = 0.0;
  root["temp"] = 0.0;
  root["hum"] = 0.0;
  size_t len = serializeJson(root, buffer);  // serialize to buffer
  ws.textAll(buffer, len); // send buffer to web socket
  // Serial.println(buffer);
  // serializeJson(doc, Serial);
}

// void task_display(void *pvParameters){
//   (void) pvParameters;
//   while (dmpReady){
    
//     if (!dmpReady) return;
//     if (mpu.dmpGetCurrentFIFOPacket(fifoBuffer)) { 
//       mpu.dmpGetQuaternion(&q, fifoBuffer);
//       mpu.dmpGetGravity(&gravity, &q);
//       mpu.dmpGetYawPitchRoll(ypr, &q, &gravity);
//       angle = ypr[0] * 180/M_PI;
//       if (angle != angle_old){
//          Serial.println(angle);
//         Serial.print(" - ");
//         Serial.println(sensor.readRangeSingleMillimeters());
//         angle_old = angle;
//       }
//     }
//   }
// }

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
      MOTOR_R.suspendService();
      MOTOR_L.suspendService();
      Serial.println("DEBUG : Reading Sensor..........");
      scanWall();
      Serial.println("DEBUG : Read Sensor Complete..........");
      MOTOR_R.resumeService();
      MOTOR_L.resumeService();
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
    if (1){
      return "ON";
    }
    else{
      return "OFF";
    }
  }
}

void task_web_client(void*){
	while(1){
    ws.cleanupClients();
    vTaskDelay(1);
  } 
}
volatile bool mpuInterrupt = false;
void dmpDataReady() {
    mpuInterrupt = true;
}

void sensorAlignment(){
  hall_detect = digitalRead(HALL_SENSOR);
  if (hall_detect){
    motor.write(SERVO_RUN_ALIGNMENT);
  }
  while(hall_detect){
    hall_detect = digitalRead(HALL_SENSOR);
  }
  motor.write(SERVO_NEUTRAL);
}

void setup(){
  #if I2CDEV_IMPLEMENTATION == I2CDEV_ARDUINO_WIRE
    Wire.begin();
    Wire.setClock(400000); 
  #elif I2CDEV_IMPLEMENTATION == I2CDEV_BUILTIN_FASTWIRE
    Fastwire::setup(400, true);
  #endif

  Serial.begin(115200);
  motor.attach(23);
  motor.write(SERVO_NEUTRAL); 
  if(!SPIFFS.begin(true)){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }

  pinMode(HALL_SENSOR, INPUT);
  pinMode(LED, OUTPUT);
  sensorAlignment();

  sensor.setTimeout(500);
  if (!sensor.init()){
      Serial.println("Failed to detect and initialize sensor!");
      while (1) {}
  }
    
  // reduce timing budget to 20 ms (default is about 33 ms)
  sensor.setMeasurementTimingBudget(20000);

  // initialize device
  Serial.println(F("Initializing I2C devices..."));
  mpu.initialize();
  pinMode(INTERRUPT_PIN, INPUT);

  Serial.println(F("Testing device connections..."));
  Serial.println(mpu.testConnection() ? F("MPU6050 connection successful") : F("MPU6050 connection failed"));

  Serial.println(F("Initializing DMP..."));
  devStatus = mpu.dmpInitialize();

  mpu.setXGyroOffset(220);
  mpu.setYGyroOffset(76);
  mpu.setZGyroOffset(-85);
  mpu.setZAccelOffset(1788); // 1688 factory default for my test chip

  if (devStatus == 0) {
    mpu.CalibrateAccel(6);
    mpu.CalibrateGyro(6);
    mpu.PrintActiveOffsets();
    Serial.println(F("Enabling DMP..."));
    mpu.setDMPEnabled(true);
    Serial.print(F("Enabling interrupt detection (Arduino external interrupt "));
    Serial.print(digitalPinToInterrupt(INTERRUPT_PIN));
    Serial.println(F(")..."));
    attachInterrupt(digitalPinToInterrupt(INTERRUPT_PIN), dmpDataReady, RISING);
    mpuIntStatus = mpu.getIntStatus();
    Serial.println(F("DMP ready! Waiting for first interrupt..."));
    dmpReady = true;
    packetSize = mpu.dmpGetFIFOPacketSize();
  } else {
      Serial.print(F("DMP Initialization failed (code "));
      Serial.print(devStatus);
      Serial.println(F(")"));
  }

  MOTOR_R.connectToPins(STEP_R, DIR_R);
  MOTOR_L.connectToPins(STEP_L, DIR_L);
  MOTOR_R.setStepsPerMillimeter(STEP_PER_MM);
  MOTOR_L.setStepsPerMillimeter(STEP_PER_MM);
  MOTOR_R.setSpeedInMillimetersPerSecond(SPEED_MM_PER_SECOND);
  MOTOR_L.setSpeedInMillimetersPerSecond(SPEED_MM_PER_SECOND);
  //MOTOR_R.setAccelerationInMillimetersPerSecondPerSecond(ACCELERATION_MM_PER_SECOND);
  //MOTOR_L.setDecelerationInMillimetersPerSecondPerSecond(DECELERATION_MM_PER_SECOND);

  
  
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

  server.on("/bootstrap-grid.min.css", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/bootstrap-grid.min.css");
  });

  server.on("/style.css", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/style.css");
  });

  server.on("/p5.min.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/p5.min.js");
  });

  server.on("/app.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/app.js");
  });

  MOTOR_R.startAsService(0);
  MOTOR_L.startAsService(1);      

  // xTaskCreate(task_display, "MPU_RUN_TASK", 8192, NULL, 1, &MPU_TaskRun_Handle);
  server.begin();
  xTaskCreate(task_web_client, "WEB_CLIENT_TASK", 1024, NULL, 1, &Client_Task_Handle);
  //digitalWrite(ledPin, HIGH);
  delay(3000);
  digitalWrite(LED, HIGH);
}

void loop() {
}