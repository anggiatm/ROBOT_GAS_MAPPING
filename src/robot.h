#ifndef robot_h
#define robot_h

// #include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
#include <ESP_FlexyStepper.h>
#include <MPU6050_6Axis_MotionApps20.h>
#include <VL53L0X.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>
// #include "SparkFun_SGP30_Arduino_Library.h"
#include <Adafruit_SGP30.h>
#include <MQUnifiedsensor.h>
#include <battery.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>
#include <pin_register.h>

#if I2CDEV_IMPLEMENTATION == I2CDEV_ARDUINO_WIRE
    #include "Wire.h"
#endif

#ifndef M_PI
    #define M_PI 3.14159265358979323846
#endif

#define OUTPUT_READABLE_YAWPITCHROLL
#define DHTTYPE DHT11   // DHT 11

// #define STEP_PER_MM 3.637827270671893389
// #define MM_PER_DEGREE 0.84648468721724984481     //97mm Diameter
#define STEP_PER_MM 7.28
#define MM_PER_DEGREE 1.69     //97mm Diameter
//#define MM_PER_DEGREE 0.82903139469730654904   //95mm Diameter

// #define SPEED_MM_PER_SECOND 35
#define SPEED_STEP_PER_SECOND 200

#define SERVO_NEUTRAL 99
#define SERVO_RUN_CW 93 //94
#define SERVO_RUN_ALIGNMENT 96

class robot {
    public:
    robot();
    ~robot();
};

#endif
