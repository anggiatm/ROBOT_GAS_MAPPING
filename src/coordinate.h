#ifndef COORDINATE_H
#define COORDINATE_H

class COORDINATE{
    public:
    void initCoordinate();
    void setCoordinate(int x, int y);
    void getCoordinate(int *x, int *y);

    void setHeading(int h);
    void getHeading(int *h);
};
#endif