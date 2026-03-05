//+------------------------------------------------------------------+
//|                                               NewCandleEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef HLCE_MQH
#define HLCE_MQH

#include <Expert\Event.mqh>
#include <Expert\HighLow.mqh>
#include <Expert\ChartHelper.mqh>

// CHighLowCreatedEvent Class Definition
class CHighLowCreatedEvent : public CEvent
{
private:
   CHighLow* highLow;
   
public:
   CHighLowCreatedEvent(string symbol, ENUM_EVENT_TYPE eventType, CHighLow* paramHighLow);
   ~CHighLowCreatedEvent();
   
   CHighLow* GetHighLow();
   string toString();
   virtual string GetDetails() override;
   virtual int GetOriginTimeframe() const override;
};

// CHighLowCreatedEvent Class Implementation
CHighLowCreatedEvent::CHighLowCreatedEvent(string symbol, ENUM_EVENT_TYPE eventType, CHighLow* paramHighLow) 
    : CEvent(symbol, eventType) {
    highLow = paramHighLow;
}

CHighLowCreatedEvent::~CHighLowCreatedEvent() {}

CHighLow* CHighLowCreatedEvent::GetHighLow() {
    return highLow;
}

string CHighLowCreatedEvent::toString() {
    return getSymbol() + "." + CChartHelper::GetTimeframeName(highLow.getSwingCandle().timeframe) + ": " + highLow.toString();
}
      
string CHighLowCreatedEvent::GetDetails() {
    return toString();
}
    
int CHighLowCreatedEvent::GetOriginTimeframe() const {
    return highLow.getSwingCandle().timeframe;
}

#endif


