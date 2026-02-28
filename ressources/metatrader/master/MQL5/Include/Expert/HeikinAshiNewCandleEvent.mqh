//+------------------------------------------------------------------+
//|                                    HeikinAshiNewCandleEvent.mqh  |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef HEIKIN_ASHI_NEW_CANDLE_EVENT_MQH
#define HEIKIN_ASHI_NEW_CANDLE_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\HeikinAshiCandle.mqh>
#include <Expert\ChartHelper.mqh>

// CHeikinAshiNewCandleEvent Class Definition
class CHeikinAshiNewCandleEvent : public CEvent
{
private:
   CHeikinAshiCandle *candle;
   
public:
   CHeikinAshiNewCandleEvent(string symbol, CHeikinAshiCandle* newCandle);
   ~CHeikinAshiNewCandleEvent();
   
   CHeikinAshiCandle* GetCandle();
   virtual int GetOriginTimeframe() const override;
   virtual string GetDetails() override;
   virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override;
};

// CHeikinAshiNewCandleEvent Class Implementation
CHeikinAshiNewCandleEvent::CHeikinAshiNewCandleEvent(string symbol, CHeikinAshiCandle* newCandle) 
    : CEvent(symbol, EV_HEIKINASHI_NEW_CANDLE) {
    candle = newCandle;
}

CHeikinAshiNewCandleEvent::~CHeikinAshiNewCandleEvent() {}

CHeikinAshiCandle* CHeikinAshiNewCandleEvent::GetCandle() {
    return candle;
}

int CHeikinAshiNewCandleEvent::GetOriginTimeframe() const {
    return candle.timeframe; 
}

string CHeikinAshiNewCandleEvent::GetDetails() {
    string result;
    result = getSymbol() + "." + CChartHelper::GetTimeframeName(candle.timeframe) + 
             ": New Heikin-Ashi Candle built at " + CHelper::TimeToString(candle.openTime);
    return result;
}

ENUM_MARKET_DIRECTION CHeikinAshiNewCandleEvent::GetMarketDirection() const { 
    return candle.isLong ? MARKET_DIRECTION_BULLISH : MARKET_DIRECTION_BEARISH;
}

#endif


