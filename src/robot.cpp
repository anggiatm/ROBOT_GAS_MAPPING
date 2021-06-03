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
 * | _async_service_task | "async_tcp"       |     1024*15       |   NULL    |    1     | &_async_service_task_handle |   -1    | AsyncTCP.cpp          |
 * | MOTOR_R->taskRunner | "FlexyStepper"    |     1024          |   NULL*   |    1     | MOTOR_R->xHandle            |   -1    | ESP_FlexyStepper.cpp  |
 * | MOTOR_L->taskRunner | "FlexyStepper"    |     1024          |   NULL*   |    1     | MOTOR_L->xHandle            |   -1    | ESP_FlexyStepper.cpp  |
 * | task_web_client     | "WEB_CLIENT_TASK" |     1024          |   NULL    |    1     | &Client_Task_Handle);       |   -1    | main.cpp              |
 * | task_display        | "MPU_RUN_TASK"    |     1024*2        |   NULL    |    1     | &MPU_TaskRun_Handle         |   -1    | main.cpp              | DEBUG MPU
 * |_____________________|___________________|___________________|___________|__________|_____________________________|_________|_______________________|
 *                                                      
*/

#include <robot.h>




ESP_FlexyStepper MOTOR_R;
ESP_FlexyStepper MOTOR_L;

//TaskHandle_t MPU_TaskInit_Handle;
TaskHandle_t MPU_TaskRun_Handle;
TaskHandle_t Client_Task_Handle;

VL53L0X sensor;
Servo motor;
MPU6050 mpu;
SGP30 SENSOR_VOC;

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
int scanTask;
uint16_t count;
bool hall_detect;
int set_heading_running = 0;
int set_forward_running = 0;

Quaternion q;           // [w, x, y, z]         quaternion container
VectorFloat gravity;    // [x, y, z]            gravity vector
float ypr[3];           // [yaw, pitch, roll]   yaw/pitch/roll container and gravity vector

// const char* ssid = "RP";
// const char* password = "rumahpenelitian123";

const char* ssid = "MIX";
const char* password = "123456789";

// Create AsyncWebServer object on port 80
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

int Gas_analog = 34;    // used for ESP32

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

void sendHeading(){
  ws.textAll(String("heading-value"));
}

int getAngle(){
    // int mapa;
    mpu.dmpGetCurrentFIFOPacket(fifoBuffer);
    mpu.dmpGetQuaternion(&q, fifoBuffer);
    mpu.dmpGetGravity(&gravity, &q);
    mpu.dmpGetYawPitchRoll(ypr, &q, &gravity);
    // int raw = (ypr[0] * 57.2958)+180;
    // if (raw<=180){
    //     mapa = map(raw, 180, 0, 0, 180);
    // }
    // else {
    //     mapa = map(raw, 359, 181, 181, 359);
    // }
    // return mapa;
    // return raw;
    return (-ypr[0] * 57.2958)+180;
}

int calculateToTargetHeading(int target_increment){
  int mpu_target = getAngle() + target_increment;
  if (mpu_target >= 360){
    mpu_target = mpu_target - 360;
  } else if(mpu_target < 0){
    mpu_target = 360 + mpu_target;
  } else{
    mpu_target = mpu_target;
  }
  return mpu_target;
}

int calculateAngleRemaining(int mpu_target){
  // RUMUS UTAMA
  int angle_reamining = mpu_target - getAngle();
  Serial.println(angle_reamining);
  if (angle_reamining > 180){
    angle_reamining = angle_reamining - 360;
  }
  else if (angle_reamining < -180){
    angle_reamining = angle_reamining + 360;
  }
  else {
    angle_reamining = angle_reamining;
  }
  return angle_reamining;
}

void setHeading(int target){
  set_heading_running = 1;
  digitalWrite(STEPPER_ENABLE_PIN, LOW);
  MOTOR_R.resumeService();
  MOTOR_L.resumeService();
  // long target_step = target*STEP_PER_MM*MM_PER_DEGREE;

  MOTOR_R.setCurrentPositionInSteps(0);
  MOTOR_L.setCurrentPositionInSteps(0);
  MOTOR_R.setSpeedInStepsPerSecond(80);
  MOTOR_L.setSpeedInStepsPerSecond(80);

  int mpu_target = calculateToTargetHeading(target);

  while (target > 1 || target < -1){                           //DEADBAND -1 to 1 degree
    target = calculateAngleRemaining(mpu_target);
    long target_step = target*STEP_PER_MM*MM_PER_DEGREE;
    MOTOR_R.setTargetPositionRelativeInSteps(-target_step);
    MOTOR_L.setTargetPositionRelativeInSteps(target_step);
    Serial.print("DEBUG : MOTOR RUNNING !! POS = ");
    Serial.println(MOTOR_L.getCurrentPositionInSteps());
    
    // MOTOR_R.setTargetPositionInMillimeters(-target_step);   
    // MOTOR_L.setTargetPositionInMillimeters(target_step);
  }
  

  // while (MOTOR_L.getCurrentPositionInSteps() != target_step && MOTOR_R.getCurrentPositionInSteps() != -target_step){
  //   Serial.print("DEBUG : MOTOR RUNNING !! POS = ");
  //   Serial.println(MOTOR_L.getCurrentPositionInSteps());
  //   // Serial.println(MOTOR_L.getTaskStackHighWaterMark());
  // }
  MOTOR_R.setCurrentPositionInSteps(0);
  MOTOR_L.setCurrentPositionInSteps(0);
  MOTOR_R.suspendService();
  MOTOR_L.suspendService();
  digitalWrite(STEPPER_ENABLE_PIN, HIGH);
  set_heading_running = 0;
}


void forward(int target){
  set_forward_running = 1;
  digitalWrite(STEPPER_ENABLE_PIN, LOW);
  MOTOR_R.resumeService();
  MOTOR_L.resumeService();
  long target_step_r = target*STEP_PER_MM;
  long target_step_l = target*STEP_PER_MM;

  MOTOR_R.setCurrentPositionInSteps(0);
  MOTOR_L.setCurrentPositionInSteps(0);
  MOTOR_R.setTargetPositionInSteps(target_step_r);
  MOTOR_L.setTargetPositionInSteps(target_step_l);

  int angle_stamp = getAngle();
  int angle_glide = calculateAngleRemaining(angle_stamp);

  while (MOTOR_L.getCurrentPositionInSteps() != target_step_l && MOTOR_R.getCurrentPositionInSteps() != target_step_r){
    Serial.print("DEBUG : MOTOR RUNNING !! POS = ");
    Serial.println(MOTOR_L.getCurrentPositionInSteps());
    MOTOR_R.setTargetPositionInSteps(target_step_r);
    MOTOR_L.setTargetPositionInSteps(target_step_l);
    // Serial.println(MOTOR_L.getTaskStackHighWaterMark());
  }
  MOTOR_R.setCurrentPositionInSteps(0);
  MOTOR_L.setCurrentPositionInSteps(0);
  MOTOR_R.suspendService();
  MOTOR_L.suspendService();
  digitalWrite(STEPPER_ENABLE_PIN, HIGH);
  set_forward_running = 0;
}

int interupt_stepper_r(){
  int current_position = MOTOR_R.getCurrentPositionInSteps();
  MOTOR_R.setCurrentPositionInSteps(0);
  MOTOR_R.setTargetPositionInSteps(0);
  return current_position;
}

int interupt_stepper_l(){
  int current_position = MOTOR_L.getCurrentPositionInSteps();
  MOTOR_L.setCurrentPositionInSteps(0);
  MOTOR_L.setTargetPositionInSteps(0);
  return current_position;
}

void forward_mpu_enable(int target){
  digitalWrite(STEPPER_ENABLE_PIN, LOW);
  MOTOR_R.resumeService();
  MOTOR_L.resumeService();
  MOTOR_R.setCurrentPositionInSteps(0);
  MOTOR_L.setCurrentPositionInSteps(0);

  int angle_stamp = getAngle();
  int angle_glide = calculateAngleRemaining(angle_stamp);
  long target_step_r = target*STEP_PER_MM;
  long target_step_l = target*STEP_PER_MM;
  int current_position_r = MOTOR_R.getCurrentPositionInSteps();
  int current_position_l = MOTOR_L.getCurrentPositionInSteps();

  MOTOR_R.setTargetPositionInSteps(target_step_r);
  MOTOR_L.setTargetPositionInSteps(target_step_l);

  while (current_position_l != target_step_l && current_position_r != target_step_r){
    angle_glide = calculateAngleRemaining(angle_stamp);
    if (angle_glide > 5 || angle_glide < -5){
      if (set_heading_running == 0){
        current_position_l = MOTOR_R.getCurrentPositionInSteps();
        current_position_r = MOTOR_L.getCurrentPositionInSteps();
        setHeading(calculateAngleRemaining(angle_stamp));
      }
      else{
        Serial.println("Set heading");
      }
    }
    else{
      if (set_heading_running == 0){
        MOTOR_R.setTargetPositionInSteps(target_step_r - current_position_r);
        MOTOR_L.setTargetPositionInSteps(target_step_l - current_position_l);
        
      } else
      {
        Serial.println("setheading");
      }
    }
    current_position_r = MOTOR_R.getCurrentPositionInSteps();
    current_position_l = MOTOR_L.getCurrentPositionInSteps();
  }

  MOTOR_R.setCurrentPositionInSteps(0);
  MOTOR_L.setCurrentPositionInSteps(0);
  MOTOR_R.suspendService();
  MOTOR_L.suspendService();
  digitalWrite(STEPPER_ENABLE_PIN, HIGH);
}



// MPU REALTIME DEBUG
void task_display(void *pvParameters){
  (void) pvParameters;
  vTaskDelay(200);

  while (1){
    vTaskDelay(1);
    count = 0;
    int hall = 0;
    int old_hall = 0;
    
    if (scanTask > 0){
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
        }
      }
      
      motor.write(SERVO_NEUTRAL);
      size_t len = serializeJson(root, buffer);  // serialize to buffer
      ws.textAll(buffer, len);
      scanTask = 0;
    }
  }
  vTaskDelete(NULL);
}


void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    String command = splitString((char*)data, '=', 0);
    String value = splitString((char*)data, '=', 1);

    if (command == "setheading"){
      Serial.println("SET HEADING");
      int val_head = value.toInt();
      setHeading(val_head);
    }
    
    else if (command == "setforward"){
      Serial.println("SET FORWARD");
      int val_forward = value.toInt();
      // forward(val_forward);
      forward_mpu_enable(val_forward);
      //clearPosition();
      //sendHeading();
    }

    else if (command == "readsensor"){
      Serial.println("DEBUG : Reading Sensor..........");
      scanTask = 1;
      Serial.println("DEBUG : Read Sensor Complete..........");
    }
    
    else {
      Serial.println("UNKNOWN COMMAND");
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
  scanTask = 0;
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

  if (SENSOR_VOC.begin() == false) {
    Serial.println("No SGP30 Detected. Check connections.");
    while (1);
  }
  //Initializes sensor for air quality readings
  //measureAirQuality should be called in one second increments after a call to initAirQuality
  SENSOR_VOC.initAirQuality();



  pinMode(HALL_SENSOR, INPUT);
  pinMode(LED, OUTPUT);
  pinMode(STEPPER_ENABLE_PIN, OUTPUT);
  digitalWrite(STEPPER_ENABLE_PIN, HIGH);
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
  mpu.setZGyroOffset(0);   // -85 default
  mpu.setZAccelOffset(1888); // 1688 factory default for my test chip

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
  } 
  else {
    Serial.print(F("DMP Initialization failed (code "));
    Serial.print(devStatus);
    Serial.println(F(")"));
  }

  MOTOR_R.connectToPins(STEP_R, DIR_R);
  MOTOR_L.connectToPins(STEP_L, DIR_L);
  MOTOR_R.setSpeedInStepsPerSecond(SPEED_STEP_PER_SECOND);
  MOTOR_L.setSpeedInStepsPerSecond(SPEED_STEP_PER_SECOND);
  
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }
  
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

  MOTOR_R.startAsService(-1);
  MOTOR_L.startAsService(-1);      

  xTaskCreateUniversal(task_display, "MPU_RUN_TASK", 1024*2, NULL, 1, &MPU_TaskRun_Handle, -1);
  server.begin();
  xTaskCreate(task_web_client, "WEB_CLIENT_TASK", 1024, NULL, 1, &Client_Task_Handle);
  //digitalWrite(ledPin, HIGH);
  delay(1000);
  dmpReady = true;
  MOTOR_R.suspendService();
  MOTOR_L.suspendService();
  digitalWrite(LED, HIGH);
  // Print ESP Local IP Address
  Serial.println(WiFi.localIP());
}

void loop() {
  // Serial.println(getAngle());
  // delay(1000); //Wait 1 second
  // //measure CO2 and TVOC levels
  // SENSOR_VOC.measureAirQuality();
  // Serial.print("CO2: ");
  // Serial.print(SENSOR_VOC.CO2);
  // Serial.print(" ppm\tTVOC: ");
  // Serial.print(SENSOR_VOC.TVOC);
  // Serial.println(" ppb");

  // int gassensorAnalog = analogRead(Gas_analog);
  // Serial.print(gassensorAnalog);

}
