#include <Arduino.h>
#include "pin_register.h"
#include "battery.h"


/************** VOLTAGE DIVIDER *****************
*       
*               Vs x R2               
*      Vout =  ---------
*              (R1 + R2)
*              
*       Vs = LiPo 3s 1600mah
*              MAX = 12.6v  4.2v per cell
*              MIN = 10.2v  3.4v per cell
*       R1 = 3K ohm
*       R2 = 1K ohm
* 
*---------------- MAX VOLATGE ------------------
*
*       12.6 x 1000               
*      -------------- = 3.15v
*       (1000 + 3000)
* 
*--------------- MAX ADC VALUE -----------------
*   4095
*                                                    
**************************************************/

battery::battery(/* args */)
{
}

int battery::getBatteryAdc(){
    return analogRead(SENSOR_BATTERY_PIN);
}

float battery::convertAdcToVoltage(int adc){
    return ((adc * 3.25)/4095 *4);
}

float battery::getBatteryVoltage(){
    return convertAdcToVoltage(getBatteryAdc());
}

int battery::getBatteryPercentage(){
    return map(getBatteryVoltage()*100, 1020, 1260, 0, 100);
}

battery::~battery()
{
}