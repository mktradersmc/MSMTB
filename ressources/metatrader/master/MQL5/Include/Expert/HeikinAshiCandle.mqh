//+------------------------------------------------------------------+
//|                                             HeikinAshiCandle.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property strict

#ifndef HEIKIN_ASHI_CANDLE_MQH
#define HEIKIN_ASHI_CANDLE_MQH

#include <Object.mqh>

// CHeikinAshiCandle Class Definition
class CHeikinAshiCandle : public CObject
{
public:
    datetime openTime;
    double open;
    double high;
    double low;
    double close;
    bool isLong;
    bool isShort;
    int timeframe;

    CHeikinAshiCandle(datetime _openTime, double _open, double _high, double _low, double _close, int _timeframe);
};

// CHeikinAshiCandle Class Implementation
CHeikinAshiCandle::CHeikinAshiCandle(datetime _openTime, double _open, double _high, double _low, double _close, int _timeframe)
    : openTime(_openTime), open(_open), high(_high), low(_low), close(_close), timeframe(_timeframe)
{
    isLong = close > open;
    isShort = close < open;
}

#endif
