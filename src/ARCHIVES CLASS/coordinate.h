#ifndef COORDINATE_H
#define COORDINATE_H

//  typedef unsigned char uint8_t;
//   typedef unsigned short uint16_t;
//   typedef unsigned long uint32_t;
//   typedef unsigned long long uint64_t;

typedef signed short int16_t;

class COORDINATE{
    public:
    void initCoordinate();
    void setCoordinate(int16_t x, int16_t y);
    void getCoordinate(int16_t *x, int16_t *y);

    void setHeading(int16_t h);
    void getHeading(int16_t *h);

    private:
    int16_t _X_VALUE;
    int16_t _Y_VALUE;
    int16_t _H_VALUE;
};
#endif