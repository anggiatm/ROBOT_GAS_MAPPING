#ifndef STEPS_H
#define STEPS_H

typedef signed short int16_t;

class STEPS{
    public:
    STEPS();
    void initStepper();
    void run();
    void moveHeading(int16_t setHeading);
    bool moveForward(int16_t setX, int16_t along);

    private:
    int16_t _x, _y;
    int16_t _current_heading;
    int16_t _sensor_heading;
    float _diffAngle;
    long _diffMM;
};
#endif

//800 step = 226mm
//1mm = 800/226
//1step = 0.2825 mm
//1mm = 3.54 step