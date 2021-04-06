#include "heading.h"
#include "coordinate.h"
#include "I2Cdev.h"
#include "MPU6050_6Axis_MotionApps20.h"
#include "Wire.h"

#ifndef M_PI
    #define M_PI 3.14159265358979323846
#endif

#define OUTPUT_READABLE_YAWPITCHROLL
#define INTERRUPT_PIN 5                // use pin 2 on Arduino Uno & most boards
#define HEADING_CORRECTION 0


MPU6050 MPU;
COORDINATE C;

// MPU control/status vars
bool dmpReady = false;  // set true if DMP init was successful
uint8_t mpuIntStatus;   // holds actual interrupt status byte from MPU
uint8_t devStatus;      // return status after each device operation (0 = success, !0 = error)
uint16_t packetSize;    // expected DMP packet size (default is 42 bytes)
uint16_t fifoCount;     // count of all bytes currently in FIFO
uint8_t fifoBuffer[64]; // FIFO storage buffer

// orientation/motion vars
Quaternion q;           // [w, x, y, z]         quaternion container
VectorInt16 aa;         // [x, y, z]            accel sensor measurements
VectorInt16 aaReal;     // [x, y, z]            gravity-free accel sensor measurements
VectorInt16 aaWorld;    // [x, y, z]            world-frame accel sensor measurements
VectorFloat gravity;    // [x, y, z]            gravity vector
float euler[3];         // [psi, theta, phi]    Euler angle container
float ypr[3];           // [yaw, pitch, roll]   yaw/pitch/roll container and gravity vector
//float ERROR = 0;

// packet structure for InvenSense teapot demo
//uint8_t teapotPacket[14] = { '$', 0x02, 0,0, 0,0, 0,0, 0,0, 0x00, 0x00, '\r', '\n' };

// ================================================================
// ===               INTERRUPT DETECTION ROUTINE                ===
// ================================================================
volatile bool mpuInterrupt = false;     // indicates whether MPU interrupt pin has gone high
void dmpDataReady() {
    mpuInterrupt = true;
}

HEADING::HEADING(){
}


int16_t HEADING::readHeading(){
    //ERROR = ERROR - HEADING_CORRECTION;
    if (MPU.dmpGetCurrentFIFOPacket(fifoBuffer)) {
        MPU.dmpGetQuaternion(&q, fifoBuffer);
        MPU.dmpGetGravity(&gravity, &q);
        MPU.dmpGetYawPitchRoll(ypr, &q, &gravity);
    Serial.print("heading");
    //Serial.println((ypr[0] * 180/M_PI)+180);
    return((ypr[0] * 180/M_PI)+180);
  }
  //return((ypr[0] * 180/M_PI)+180);
}

void HEADING::initHeading(){
    Wire.begin();
    Wire.setClock(400000); // 400kHz I2C clock. Comment this line if having compilation difficulties

    // initialize device
    Serial.println(F("Initializing I2C devices..."));
    MPU.initialize();
    pinMode(INTERRUPT_PIN, INPUT);

    // verify connection
    //Serial.println(F("Testing device connections..."));
    Serial.println(MPU.testConnection() ? F("MPU6050 connection successful") : F("MPU6050 connection failed"));

    // load and configure the DMP
    //Serial.println(F("Initializing DMP..."));
    devStatus = MPU.dmpInitialize();

    // supply your own gyro offsets here, scaled for min sensitivity
    MPU.setXGyroOffset(220);
    MPU.setYGyroOffset(76);
    MPU.setZGyroOffset(-85);
    MPU.setZAccelOffset(1788); // 1688 factory default for my test chip

    // make sure it worked (returns 0 if so)
    if (devStatus == 0) {
        // Calibration Time: generate offsets and calibrate our MPU6050
        MPU.CalibrateAccel(6);
        MPU.CalibrateGyro(6);
        MPU.PrintActiveOffsets();
        // turn on the DMP, now that it's ready
        Serial.println(F("Enabling DMP..."));
        MPU.setDMPEnabled(true);

        // enable Arduino interrupt detection
        Serial.print(F("Enabling interrupt detection (Arduino external interrupt "));
        Serial.print(digitalPinToInterrupt(INTERRUPT_PIN));
        Serial.println(F(")..."));
        attachInterrupt(digitalPinToInterrupt(INTERRUPT_PIN), dmpDataReady, RISING);
        mpuIntStatus = MPU.getIntStatus();

        // set our DMP Ready flag so the main loop() function knows it's okay to use it
        Serial.println(F("DMP ready! Waiting for first interrupt..."));
        dmpReady = true;

        // get expected DMP packet size for later comparison
        packetSize = MPU.dmpGetFIFOPacketSize();
    } else {
        Serial.print(F("DMP Initialization failed (code "));
        Serial.print(devStatus);
        Serial.println(F(")"));
    }

}
