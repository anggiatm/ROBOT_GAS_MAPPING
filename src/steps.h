#ifndef STEPS_H
#define STEPS_H

class STEPS{
    public:
    STEPS();
    void initStepper();
    //bool goTo(float x, float y, float h);
    void run();
    bool moveHeading(int setHeading);
    bool moveForward(int setX, int along);
};
#endif

//800 step = 226mm
//1mm = 800/226
//1step = 0.2825 mm
//1mm = 3.54 step