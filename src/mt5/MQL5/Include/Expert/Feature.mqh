//+------------------------------------------------------------------+
//|                                                      Feature.mqh |
//|                                   Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef FEATURE_MQH
#define FEATURE_MQH

#include <Object.mqh>
#include <Expert\Event.mqh>
#include <Expert\Candle.mqh>

class CFeature : public CObject
{
public:
    virtual string GetName() = 0;
    virtual void GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) = 0;
    virtual void GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) = 0;
    virtual void GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) = 0;
    virtual void GetRequiredTimeframes(int& timeframes[]) = 0;
    virtual void Initialize() = 0;
    virtual void Update(CCandle* candle) = 0;
    virtual void ProcessEvents() = 0;
    virtual void Deinitialize() = 0;
};

#endif


