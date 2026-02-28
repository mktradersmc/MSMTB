//+------------------------------------------------------------------+
//|                                                 MomentumWave.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef MOMENTUM_WAVE_MQH
#define MOMENTUM_WAVE_MQH

#include <Object.mqh>
#include <Expert\Candle.mqh>

// CMomentumWave Class Definition
class CMomentumWave : public CObject {
public:
    double peakValue;
    double signalValue;
    CCandle* peakCandle;
    CCandle* signalCandle;
    int direction;

    CMomentumWave();
    ~CMomentumWave();
    
    bool IsMountain();
    bool IsValley();
    string toString();
};

// CMomentumWave Class Implementation
CMomentumWave::CMomentumWave() {}
CMomentumWave::~CMomentumWave() {}

string CMomentumWave::toString()
{
   string result;
   string type = IsMountain() ? "Berg" : "Tal";
   string peak = peakCandle == NULL ? "<no candle associated>" : TimeToString(peakCandle.openTime, TIME_DATE|TIME_MINUTES);
   
   result = "MV (" + type + "). WT2 Peak = " + DoubleToString(peakValue) + ", Signal = " + DoubleToString(signalValue) + 
            ". Signal um " + TimeToString(signalCandle.openTime, TIME_DATE|TIME_MINUTES) + 
            ", Peak Candle um " + peak;
   
   return result; 
}

bool CMomentumWave::IsMountain()
{
   return direction == 1;
}
    
bool CMomentumWave::IsValley()
{
   return direction == -1;
}

#endif


