#ifndef robot_h
#define robot_h

#include <Arduino.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SPIFFS.h>
#include <ESP_FlexyStepper.h>
#include "MPU6050_6Axis_MotionApps20.h"
#include <VL53L0X.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>
#include "SparkFun_SGP30_Arduino_Library.h"

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
#define MM_PER_DEGREE 0.84648468721724984481     //97mm Diameter
//#define MM_PER_DEGREE 0.82903139469730654904   //95mm Diameter

#define DIR_R 32
#define STEP_R 33
#define DIR_L 25
#define STEP_L 26
#define STEPPER_ENABLE_PIN 13

// #define SPEED_MM_PER_SECOND 35
#define SPEED_STEP_PER_SECOND 80

#define SERVO_NEUTRAL 99
#define SERVO_RUN_CW 94
#define SERVO_RUN_ALIGNMENT 96

#define HALL_SENSOR 19  // INVERTED !!! || ON = 0 || OFF = 1
#define LED 2

class robot {
    public:
    robot();
    ~robot();
    void setHeading(void);
};

#endif
