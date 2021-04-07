#ifndef NAVIGATION_H
#define NAVIGATION_H

class NAVIGATION{
    public:
    void navigation(int16_t x, int16_t y);
    void heading(int16_t h);

    private:
    int16_t HEADING_ACTUAL;
    int16_t X_ACTUAL;
    int16_t Y_ACTUAL;
};
#endif