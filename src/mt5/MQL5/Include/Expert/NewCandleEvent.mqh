//+------------------------------------------------------------------+
//|                                               NewCandleEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef NEW_CANDLE_EVENT_MQH
#define NEW_CANDLE_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\Candle.mqh>
#include <Expert\ChartHelper.mqh>

// CNewCandleEvent Class Definition
class CNewCandleEvent : public CEvent
{
private:
   CCandle *candle;
   
public:
   CNewCandleEvent(string symbol, ENUM_EVENT_TYPE eventType, CCandle* newCandle);
   ~CNewCandleEvent();
   
   CCandle* getCandle();
   virtual int GetOriginTimeframe() const override;
   virtual string GetDetails() override;
   virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override;
};

// CNewCandleEvent Class Implementation
CNewCandleEvent::CNewCandleEvent(string symbol, ENUM_EVENT_TYPE eventType, CCandle* newCandle) 
   : CEvent(symbol, eventType) {
   candle = newCandle;
}

CNewCandleEvent::~CNewCandleEvent() {}

CCandle* CNewCandleEvent::getCandle() {
   return candle;
}

int CNewCandleEvent::GetOriginTimeframe() const {
   return candle.timeframe; 
}

string CNewCandleEvent::GetDetails() {
    string result;
    result = getSymbol() + "." + CChartHelper::GetTimeframeName(candle.timeframe) + 
             ": New Candle build at " + CHelper::TimeToString(candle.openTime) + 
             ". " + candle.toString();
    return result;
}

ENUM_MARKET_DIRECTION CNewCandleEvent::GetMarketDirection() const { 
   return candle.isUpCandle() ? MARKET_DIRECTION_BULLISH : MARKET_DIRECTION_BEARISH;
}

#endif


