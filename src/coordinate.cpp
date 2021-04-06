#include "coordinate.h"
#include "heading.h"
#include "AccelStepper.h"

#ifndef M_PI
    #define M_PI 3.14159265358979323846
#endif

//constructor

int X_VALUE;
int Y_VALUE;

int H_VALUE;

void COORDINATE::initCoordinate(){
    setCoordinate(0,0);
    setHeading(0);
}

void COORDINATE::setCoordinate(int x, int y){
    X_VALUE = x;
    Y_VALUE = y;
}

void COORDINATE::getCoordinate(int *x_val, int *y_val){
    *x_val = X_VALUE;
    *y_val = Y_VALUE;
}

void COORDINATE::setHeading(int h){
    H_VALUE = h;
}

void COORDINATE::getHeading(int *h_val){
    *h_val = H_VALUE;
}