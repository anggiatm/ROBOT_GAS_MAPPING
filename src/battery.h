
class battery
{
private:
    float convertAdcToVoltage(int adc);
    int getBatteryAdc();
public:
    battery(/* args */);
    ~battery();

    float getBatteryVoltage();
    int getBatteryPercentage();
};


