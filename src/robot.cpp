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

/*******************************************************************************************************************************
 * ----------------------------------------------- MAIN TASK MANAGEMENT  --------------------------------------------------------------------
 * ______________________________________________________________________________________________________________________________________________________
 * |                     |                   | STACK SIZE (byte) |           |          |                             | RUNNING |                       |
 * |    TASK FUNCTION    |     TASK NAME     |  RAM CONSUMPTION  | PARAMETER | PRIORITY |          TASK HANDLE        |   CORE  |          FILE         |
 * |_____________________|___________________|___________________|___________|__________|_____________________________|_________|_______________________|
 * | _async_service_task | "async_tcp"       |     1024*16       |   NULL    |    1     | &_async_service_task_handle |   -1    | AsyncTCP.cpp          |
 * | MOTOR_R->taskRunner | "FlexyStepper"    |     1024          |   NULL*   |    1     | MOTOR_R->xHandle            |   -1    | ESP_FlexyStepper.cpp  |
 * | MOTOR_L->taskRunner | "FlexyStepper"    |     1024          |   NULL*   |    1     | MOTOR_L->xHandle            |   -1    | ESP_FlexyStepper.cpp  |
 * | task_watch_command  | "MPU_RUN_TASK"    |     1024*6        |   NULL    |    1     | &watchCommand_Handle        |   -1    | main.cpp              | 
 * |_____________________|___________________|___________________|___________|__________|_____________________________|_________|_______________________|
*/

#include <robot.h>

ESP_FlexyStepper MOTOR_R;
ESP_FlexyStepper MOTOR_L;

TaskHandle_t watchCommand_Handle;

Servo MOTOR_SERVO;
VL53L0X SENSOR_RANGE;
MPU6050 SENSOR_MPU;
// SGP30 SENSOR_VOC;
Adafruit_SGP30 SENSOR_VOC;
battery SENSOR_BATTERY;

DynamicJsonDocument doc(1024*6); // fixed size 9216
JsonObject root = doc.to<JsonObject>();
char buffer[4096]; // create temp buffer
size_t buffer_len;

JsonArray wall = doc.createNestedArray("wall");
JsonObject gas = doc.createNestedObject("gas");

uint8_t mpuIntStatus;   // holds actual interrupt status byte from MPU
uint8_t devStatus;
uint16_t packetSize;
uint16_t fifoCount;     // count of all bytes currently in FIFO
uint8_t fifoBuffer[64]; // FIFO storage buffer

int angle;
int angle_old = 0;
sensors_event_t DHT11_EVENT;

uint8_t count;
bool hall_detect;
uint8_t set_heading_running = 0;
uint8_t set_forward_running = 0;
uint8_t set_scan_running = 0;
uint8_t set_calibrate_running = 0;
uint8_t enable_brake = 0;

float angle_offset = 0;
const float radian = 57.3;
int calibrated_angle;

int val_heading;
int val_forward;
int val_calibrate;

Quaternion q;           // [w, x, y, z]         quaternion container
VectorFloat gravity;    // [x, y, z]            gravity vector
float ypr[3];           // [yaw, pitch, roll]   yaw/pitch/roll container and gravity vector
volatile bool mpuInterrupt = false;

MQUnifiedsensor MQ2("ESP32", 3.3, 12, SMOKE_SENSOR, "MQ-2");

const char* ssid = "RP";
const char* password = "rumahpenelitian123";

// const char* ssid = "MIX";
// const char* password = "123456789";

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

DHT_Unified SENSOR_DHT(DHT11_PIN, DHTTYPE);

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

int normalizeAngle(int a){
  if (a >= 360){
    a = a - 360;
  } else if(a < 0){
    a = 360 + a;
  } else{
    a = a;
  }
  return a;
}

int getAngle(){
    SENSOR_MPU.dmpGetCurrentFIFOPacket(fifoBuffer);
    SENSOR_MPU.dmpGetQuaternion(&q, fifoBuffer);
    SENSOR_MPU.dmpGetGravity(&gravity, &q);
    SENSOR_MPU.dmpGetYawPitchRoll(ypr, &q, &gravity);

    calibrated_angle = (-ypr[0] * radian) + 180;
    calibrated_angle = calibrated_angle + angle_offset;
    calibrated_angle = normalizeAngle(round(calibrated_angle));
    return calibrated_angle;
}

float getAngleRaw(){
  SENSOR_MPU.dmpGetCurrentFIFOPacket(fifoBuffer);
  SENSOR_MPU.dmpGetQuaternion(&q, fifoBuffer);
  SENSOR_MPU.dmpGetGravity(&gravity, &q);
  SENSOR_MPU.dmpGetYawPitchRoll(ypr, &q, &gravity);
  return ((-ypr[0] * 57.2958) + 180);
}

void calibrateMpu(int webui_angle){
  angle_offset = webui_angle - getAngleRaw();
}

int calculateToTargetHeading(int target_increment){
  int mpu_target = getAngle() + target_increment;
  normalizeAngle(mpu_target);
  return mpu_target;
}

int calculateAngleRemaining(int mpu_target){
  // RUMUS UTAMA
  int angle_remaining = mpu_target - getAngle();
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

void enableMotor(){
  digitalWrite(STEPPER_ENABLE_PIN, LOW);
}

void disableMotor(){
  digitalWrite(STEPPER_ENABLE_PIN, HIGH);
}

void setZeroStepPosition(){
  MOTOR_R.setCurrentPositionInSteps(0);
  MOTOR_L.setCurrentPositionInSteps(0);
}

void resumeMotorTask(){
  enableMotor();
  MOTOR_R.resumeService();
  MOTOR_L.resumeService();
  setZeroStepPosition();
}

void suspendMotorTask(){
  setZeroStepPosition();
  MOTOR_R.suspendService();
  MOTOR_L.suspendService();
  if (enable_brake == 0){
    disableMotor();
  }
}

void setHeading(int target){
  resumeMotorTask();
  SENSOR_MPU.resetFIFO();
  int mpu_target = calculateToTargetHeading(target);
  int angle_glide = calculateAngleRemaining(mpu_target);

  while (angle_glide != 0){                           //DEADBAND 0
    MOTOR_R.setTargetPositionRelativeInSteps(-target);
    MOTOR_L.setTargetPositionRelativeInSteps(target);
    angle_glide = calculateAngleRemaining(mpu_target);
    // Serial.print("DEBUG : MOTOR RUNNING !! POS = ");
    // Serial.println(MOTOR_L.getCurrentPositionInSteps()); 
  }
  suspendMotorTask();
}

void forward(int target){
  resumeMotorTask();

  int angle_stamp = getAngle();
  int angle_glide = calculateAngleRemaining(angle_stamp);
  long target_step_r = target*STEP_PER_MM;
  long target_step_l = target*STEP_PER_MM;
  int current_position_r = MOTOR_R.getCurrentPositionInSteps();
  int current_position_l = MOTOR_L.getCurrentPositionInSteps();

  while(current_position_r != target_step_r){
    MOTOR_R.setTargetPositionRelativeInSteps(target_step_r - current_position_r);
    MOTOR_L.setTargetPositionRelativeInSteps(target_step_l - current_position_l);
    current_position_r = MOTOR_R.getCurrentPositionInSteps();
    current_position_l = MOTOR_L.getCurrentPositionInSteps();
    angle_glide = calculateAngleRemaining(angle_stamp);
    while (angle_glide < -1 || angle_glide > 1){           
      angle_glide = calculateAngleRemaining(angle_stamp);
      MOTOR_R.setTargetPositionRelativeInSteps(-angle_glide);
      MOTOR_L.setTargetPositionRelativeInSteps(angle_glide);
    }
  }
  angle_glide = calculateAngleRemaining(angle_stamp);
  while (angle_glide < -1 || angle_glide > 1){           
    MOTOR_R.setTargetPositionRelativeInSteps(-angle_glide);
    MOTOR_L.setTargetPositionRelativeInSteps(angle_glide);
    angle_glide = calculateAngleRemaining(angle_stamp);
    // Serial.print("DEBUG : MOTOR RUNNING !! POS = ");
    // Serial.println(MOTOR_L.getCurrentPositionInSteps()); 
  }
  suspendMotorTask();
}

void scan(){
  SENSOR_MPU.resetFIFO();
  count = 0;
  uint8_t hall = 0;
  uint8_t old_hall = 0;
  MOTOR_SERVO.write(SERVO_RUN_CW);
  digitalWrite(FAN_RELAY_PIN, HIGH);
  while (count <= 1){
    hall = digitalRead(HALL_SENSOR);
    if (hall != old_hall){
      old_hall = hall;
      count = count + 1;
    }
    angle = getAngle();
    if (angle != angle_old){
      wall[angle] = SENSOR_RANGE.readRangeSingleMillimeters();
      angle_old = angle;
      // Serial.println(angle);
    }
  }
  
  MOTOR_SERVO.write(SERVO_NEUTRAL);
  //measure CO2 and TVOC levels
  digitalWrite(FAN_RELAY_PIN, LOW);
  SENSOR_VOC.IAQmeasure();
  gas["voc"] = SENSOR_VOC.TVOC;
  gas["co2"] = SENSOR_VOC.eCO2;

  MQ2.update();
  gas["smoke"] = MQ2.readSensor();

  SENSOR_DHT.temperature().getEvent(&DHT11_EVENT);
  gas["temp"] = DHT11_EVENT.temperature;
  SENSOR_DHT.humidity().getEvent(&DHT11_EVENT);
  gas["hum"] = DHT11_EVENT.relative_humidity;
  //measure battery level
  gas["battVolt"] = SENSOR_BATTERY.getBatteryVoltage();
  gas["battPers"] = SENSOR_BATTERY.getBatteryPercentage();
  

  
  buffer_len = serializeJson(root, buffer);  // serialize to buffer
}

void task_watch_command(void *pvParameters){
  (void) pvParameters;
  vTaskDelay(500);
  while (1){
    if (set_scan_running > 0){
      scan();
      set_scan_running = 0;
      // vTaskDelay(1000/portTICK_PERIOD_MS);
      ws.textAll(buffer, buffer_len);
    }

    if (set_heading_running > 0){
      getAngle();
      setHeading(val_heading);
      set_heading_running = 0;
      // vTaskDelay(1000/portTICK_PERIOD_MS);
      ws.textAll("setheadingcomplete");
    }

    if (set_forward_running > 0){
      getAngle();
      forward(val_forward);
      set_forward_running = 0 ;
      // vTaskDelay(1000/portTICK_PERIOD_MS);
      ws.textAll("setforwardcomplete");
    }

    if (set_calibrate_running > 0){
      calibrateMpu(val_calibrate);
      set_calibrate_running = 0;
      // vTaskDelay(1000/portTICK_PERIOD_MS);
      ws.textAll("calibratempucomplete");
    }
    ws.cleanupClients();
  }
  vTaskDelete(NULL);
}

void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    if (set_heading_running > 0 || set_forward_running > 0 || set_scan_running > 0 || set_calibrate_running > 0){
      // REJECT COMMAND
      ws.textAll("ROBOT BUSSY");
    } else {
      String command = splitString((char*)data, '=', 0);
      String value = splitString((char*)data, '=', 1);
      if (command == "setheading"){
        Serial.println("DEBUG : COMMAND SET HEADING");
        val_heading = value.toInt();
        set_heading_running = 1;
      }

      else if (command == "setforward"){
        Serial.println("DEBUG : COMMAND SET FORWARD");
        val_forward = value.toInt();
        set_forward_running = 1;
      }

      else if (command == "readsensor"){
        Serial.println("DEBUG : COMMAND READ SENSOR");
        set_scan_running = 1;
      }

      else if (command == "calibratempu"){
        Serial.println("DEBUG : COMMAND CALIBRATE MPU");
        val_calibrate = value.toInt();
        set_calibrate_running = 1;
      }

      else if (command == "enablebrake"){
        Serial.println("DEBUG : ENABLE BRAKE");
        enable_brake = 1;
      }

      else if (command == "disablebrake"){
        Serial.println("DEBUG : DISABLE BRAKE");
        enable_brake = 0;
      }

      else {
        Serial.println("UNKNOWN COMMAND");
      }
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
      Serial.println("WS_EVT_PONG");
      break;
    case WS_EVT_ERROR:
      Serial.println("ERROR");
      break;
  }
}

void dmpDataReady() {
    mpuInterrupt = true;
}

void sensorAlignment(){
  hall_detect = digitalRead(HALL_SENSOR);
  if (hall_detect){
    MOTOR_SERVO.write(SERVO_RUN_ALIGNMENT);
  }
  while(hall_detect){
    hall_detect = digitalRead(HALL_SENSOR);
  }
  MOTOR_SERVO.write(SERVO_NEUTRAL);
}

void setup(){
  #if I2CDEV_IMPLEMENTATION == I2CDEV_ARDUINO_WIRE
    Wire.begin();
    Wire.setClock(400000); 
  #elif I2CDEV_IMPLEMENTATION == I2CDEV_BUILTIN_FASTWIRE
    Fastwire::setup(400, true);
  #endif

  Serial.begin(115200);
  MOTOR_SERVO.attach(23);
  MOTOR_SERVO.write(SERVO_NEUTRAL); 

  pinMode(HALL_SENSOR, INPUT);
  pinMode(STEPPER_ENABLE_PIN, OUTPUT);
  pinMode(LED_R, OUTPUT);
  pinMode(LED_G, OUTPUT);
  pinMode(LED_B, OUTPUT);

  pinMode(FAN_RELAY_PIN,OUTPUT);
  pinMode(INTERRUPT_PIN, INPUT);
  pinMode(SMOKE_SENSOR, INPUT);
  pinMode(SENSOR_BATTERY_PIN, INPUT);

  if(!SPIFFS.begin(true)){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }

  // if (SENSOR_VOC.begin() == false) {
  //   Serial.println("No SGP30 Detected. Check connections.");
  //   while (1);
  // }
  SENSOR_VOC.begin();
  MQ2.setRegressionMethod(1); //_PPM =  a*ratio^b
  MQ2.setA(36974); MQ2.setB(-3.109);
  /*
    Exponential regression:
    Gas    | a      | b
    H2     | 987.99 | -2.162
    LPG    | 574.25 | -2.222
    CO     | 36974  | -3.109
    Alcohol| 3616.1 | -2.675
    Propane| 658.71 | -2.168
  */
  MQ2.init(); 
  float calcR0 = 0;
  for(int i = 1; i<=10; i++)
  {
    MQ2.update(); // Update data, the arduino will be read the voltage on the analog pin
    calcR0 += MQ2.calibrate(9.83);
    Serial.print(".");
  }
  MQ2.setR0(calcR0/10);

  SENSOR_DHT.begin();

  disableMotor();
  sensorAlignment();

  SENSOR_RANGE.setTimeout(500);
  if (!SENSOR_RANGE.init()){
      Serial.println("Failed to detect and initialize sensor!");
      while (1) {}
  }
  // reduce timing budget to 20 ms (default is about 33 ms)
  SENSOR_RANGE.setMeasurementTimingBudget(20000);

  // initialize device
  Serial.println(F("Initializing I2C devices..."));
  SENSOR_MPU.initialize();
  

  Serial.println(F("Testing device connections..."));
  Serial.println(SENSOR_MPU.testConnection() ? F("MPU6050 connection successful") : F("MPU6050 connection failed"));

  Serial.println(F("Initializing DMP..."));
  devStatus = SENSOR_MPU.dmpInitialize();

  SENSOR_MPU.setXGyroOffset(220);
  SENSOR_MPU.setYGyroOffset(76);
  SENSOR_MPU.setZGyroOffset(0);   // -85 default
  SENSOR_MPU.setZAccelOffset(1888); // 1688 factory default for my test chip

  if (devStatus == 0) {
    SENSOR_MPU.CalibrateAccel(6);
    SENSOR_MPU.CalibrateGyro(6);
    SENSOR_MPU.PrintActiveOffsets();
    Serial.println(F("Enabling DMP..."));
    SENSOR_MPU.setDMPEnabled(true);
    Serial.print(F("Enabling interrupt detection (Arduino external interrupt "));
    Serial.print(digitalPinToInterrupt(INTERRUPT_PIN));
    Serial.println(F(")..."));
    attachInterrupt(digitalPinToInterrupt(INTERRUPT_PIN), dmpDataReady, RISING);
    mpuIntStatus = SENSOR_MPU.getIntStatus();
    Serial.println(F("DMP ready! Waiting for first interrupt..."));
    // dmpReady = true;
    packetSize = SENSOR_MPU.dmpGetFIFOPacketSize();
  } 
  else {
    Serial.print(F("DMP Initialization failed (code "));
    Serial.print(devStatus);
    Serial.println(F(")"));
  }
  delay(3000);

  MOTOR_R.connectToPins(STEP_R, DIR_R);
  MOTOR_L.connectToPins(STEP_L, DIR_L);
  MOTOR_R.setSpeedInStepsPerSecond(SPEED_STEP_PER_SECOND);
  MOTOR_L.setSpeedInStepsPerSecond(SPEED_STEP_PER_SECOND);
  MOTOR_R.setAccelerationInStepsPerSecondPerSecond(80.0);
  MOTOR_L.setAccelerationInStepsPerSecondPerSecond(80.0);
  MOTOR_R.setDecelerationInStepsPerSecondPerSecond(600.0);
  MOTOR_L.setDecelerationInStepsPerSecondPerSecond(600.0);
  
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi..");
    // ESP.restart();
  }
  
  ws.onEvent(onEvent);
  server.addHandler(&ws);

  // Route for root / web page

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/index.html");
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

  server.on("/fuzzy-min.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/fuzzy-min.js");
  });

  server.on("/app.js", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/app.js");
  });

  MOTOR_R.startAsService(-1);
  MOTOR_L.startAsService(-1);      

  xTaskCreateUniversal(task_watch_command, "WATCH_COMMAND_TASK", 1024*6, NULL, 1, &watchCommand_Handle, -1);
  server.begin();
  
  MOTOR_R.suspendService();
  MOTOR_L.suspendService();
  // digitalWrite(LED_R, HIGH);

  // Print ESP Local IP Address
  Serial.println(WiFi.localIP());
}

void loop() {
  Serial.println(MQ2.readSensor());

  // Serial.println(SENSOR_RANGE.readRangeSingleMillimeters());
  vTaskDelay(2000/portTICK_PERIOD_MS);
}
