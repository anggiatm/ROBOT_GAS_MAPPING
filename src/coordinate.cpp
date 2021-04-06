#include "coordinate.h"
#include "heading.h"
#include "AccelStepper.h"


#ifndef M_PI
    #define M_PI 3.14159265358979323846
#endif

//constructor

void COORDINATE::initCoordinate(){
    setCoordinate(0,0);
    setHeading(0);
}

void COORDINATE::setCoordinate(int x, int y){
    _X_VALUE = x;
    _Y_VALUE = y;
}

void COORDINATE::getCoordinate(int *x_val, int *y_val){
    *x_val = _X_VALUE;
    *y_val = _Y_VALUE;
}

void COORDINATE::setHeading(int16_t h){
    _H_VALUE = h;
}

void COORDINATE::getHeading(int16_t *h_val){
    *h_val = _H_VALUE;
}