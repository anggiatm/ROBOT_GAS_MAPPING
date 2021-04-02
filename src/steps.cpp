#include "steps.h"
#include "heading.h"
#include "AccelStepper.h"

#ifndef M_PI
    #define M_PI 3.14159265358979323846
#endif

// STEPPER PIN
#define DIR_R 32
#define STEP_R 33
#define DIR_L 25
#define STEP_L 26

//STEP PER MM 
// 1/4 STEP 
//800 step = 226mm
//1mm = 800/226
//1step = 0.2825 mm
//1mm = 3.54 step
#define STEP_PER_MM 3.54
// keliling ban 226mm
#define LENGHT_PER_ROTATION 84

//HEADING DEADBAND IN PERCENTAGE 0.01*360
#define HEADING_DEADBAND 0.1   

uint8_t sequence = 0;

HEADING HEAD;


AccelStepper STEPPER_R(AccelStepper::DRIVER, STEP_R, DIR_R);
AccelStepper STEPPER_L(AccelStepper::DRIVER, STEP_L, DIR_L);

//constructor
STEPS::STEPS(){
    
}

void STEPS::initStepper(){
    STEPPER_R.setMaxSpeed(400.0);
    STEPPER_R.setAcceleration(150.0);
    STEPPER_L.setPinsInverted (true, false, false); // (bool directionInvert=false, bool stepInvert=false, bool enableInvert=false)
    //STEPPER_R.moveTo(800);
    STEPPER_L.setMaxSpeed(400.0);
    STEPPER_L.setAcceleration(150.0);
    STEPPER_L.setPinsInverted (false, false, false); // (bool directionInvert=false, bool stepInvert=false, bool enableInvert=false)
    //STEPPER_L.moveTo(800);

}



void STEPS::goTo(float x, float y, float h){
    if (sequence == 0){
        float diffAngle = (h - HEAD.getHeading())/360;
        if(diffAngle < -HEADING_DEADBAND || diffAngle > HEADING_DEADBAND){
            sequence = 1;
        } else{
            sequence = 0;
        }
    }
    if (sequence == 1){
        if (round(HEAD.getHeading()) != h){
        int diffAngle = h - HEAD.getHeading();
        float diffMM = M_PI*84*diffAngle/360;
        STEPPER_R.move(diffMM*STEP_PER_MM);
        STEPPER_L.move(diffMM*STEP_PER_MM);
        sequence = 1;
        } else{
            STEPPER_R.setCurrentPosition(0);
            STEPPER_L.setCurrentPosition(0);
            sequence = 2;   
        }
    } else if (sequence == 2){
        STEPPER_R.moveTo(-y*STEP_PER_MM);
        STEPPER_L.moveTo(y*STEP_PER_MM);
        if (STEPPER_R.distanceToGo() == 0 && STEPPER_L.distanceToGo() == 0){
            STEPPER_R.setCurrentPosition(0);
            STEPPER_L.setCurrentPosition(0);
            sequence = 0;
        } else {
            sequence = 2;
        }
    }
    
}

void STEPS::run(){
    STEPPER_R.run();
    STEPPER_L.run();
}



