// #include "steps.h"
// #include "heading.h"
// #include "coordinate.h"
// #include "AccelStepper.h"

// #ifndef M_PI
//     #define M_PI 3.14159265358979323846
// #endif

// // STEPPER PIN
// #define DIR_R 32
// #define STEP_R 33
// #define DIR_L 25
// #define STEP_L 26

// //STEP PER MM 
// // 1/4 STEP 
// //800 step = 226mm
// //1mm = 800/226
// //1step = 0.2825 mm
// //1mm = 3.54 step

// #define STEP_PER_MM 3.54
// // keliling ban 226mm
// #define LENGHT_PER_ROTATION 84

// //HEADING DEADBAND IN PERCENTAGE 0.01*360
// #define HEADING_DEADBAND 0.005   

// HEADING HEAD;
// COORDINATE COOR;


// AccelStepper STEPPER_R(AccelStepper::DRIVER, STEP_R, DIR_R);
// AccelStepper STEPPER_L(AccelStepper::DRIVER, STEP_L, DIR_L);

// //constructor
// STEPS::STEPS(){
    
// }

// void STEPS::initStepper(){
//     STEPPER_R.setMaxSpeed(400.0);
//     STEPPER_R.setAcceleration(150.0);
//     STEPPER_R.setPinsInverted (true, false, false); // (bool directionInvert=false, bool stepInvert=false, bool enableInvert=false)

//     STEPPER_L.setMaxSpeed(400.0);
//     STEPPER_L.setAcceleration(150.0);
//     STEPPER_L.setPinsInverted (false, false, false); // (bool directionInvert=false, bool stepInvert=false, bool enableInvert=false)

// }


// void STEPS::moveHeading(int16_t setHeading){
//     COOR.getHeading(&_current_heading);

//     while (setHeading != _current_heading)
//     {
//         _diffAngle = abs(((float)setHeading - (float)_current_heading)/(float)360);
//     if(_diffAngle > -HEADING_DEADBAND && _diffAngle < HEADING_DEADBAND){
//         // TARGET ANGLE TERPENUHI = LANGSUNG SUMBU X
//         STEPPER_R.setCurrentPosition(0);
//         STEPPER_L.setCurrentPosition(0);
//         COOR.setHeading(setHeading);
//         //return true;
//     }
//     else{
//         // TARGET ANGLE TIDAK TERPENUHI = GO TO HEADING
//         _sensor_heading = HEAD.readHeading();
//         if (_sensor_heading != setHeading){
//             //int diffAngle = setHeading - _sensor_heading;
//             _diffMM = M_PI*84*_diffAngle/360*STEP_PER_MM;
//             STEPPER_R.move(_diffMM);
//             STEPPER_L.move(_diffMM);
//             STEPPER_R.run();
//             STEPPER_L.run();
//             COOR.setHeading(_sensor_heading);
//             //return false;
//         }
//         else{
//             STEPPER_R.setCurrentPosition(0);
//             STEPPER_L.setCurrentPosition(0);
//             COOR.setHeading(setHeading);
//             //return true;
//         }
//     }
// }
    

    
// }

// bool STEPS::moveForward(int16_t setX, int16_t along){

//     STEPPER_R.moveTo(-setX*STEP_PER_MM);
//     STEPPER_L.moveTo(setX*STEP_PER_MM);
//     //Serial.println("moveforward");
//     STEPPER_R.run();
//     STEPPER_L.run();
//     if (STEPPER_R.distanceToGo() == 0 && STEPPER_L.distanceToGo() == 0){
//         STEPPER_R.setCurrentPosition(0);
//         STEPPER_L.setCurrentPosition(0);
//         COOR.getCoordinate(&_x, &_y);
//         if (along == 0){
//             COOR.setCoordinate(_x+setX, _y);
//         } else if (along == 1){
//             COOR.setCoordinate(_x, _y+setX);
//         }
//         return true;
//     } else {
//         return false;
//     }

// }

// void STEPS::run(){
//     STEPPER_R.run();
//     STEPPER_L.run();
// }



