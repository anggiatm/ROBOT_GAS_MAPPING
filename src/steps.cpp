#include "steps.h"
const int LED_PIN = 13;
//constructor
STEPS::STEPS(){
}

void STEPS::setStepPerMM(int step){

}

float STEPS::setStep(float mm){
    return(mm*3.54);
}

//800 step = 226mm
//1mm = 800/226
//1step = 0.2825 mm
//1mm = 3.54 step