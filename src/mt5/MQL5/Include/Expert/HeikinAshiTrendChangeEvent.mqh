//+------------------------------------------------------------------+
//|                                 HeikinAshiTrendChangeEvent.mqh   |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef HEIKIN_ASHI_TREND_CHANGE_EVENT_MQH
#define HEIKIN_ASHI_TREND_CHANGE_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\HeikinAshiCandle.mqh>
#include <Expert\ChartHelper.mqh>

// CHeikinAshiTrendChangeEvent Class Definition
class CHeikinAshiTrendChangeEvent : public CEvent
{
private:
    int m_timeframe;
    bool oldTrend;  // true for bullish, false for bearish
    bool newTrend;  // true for bullish, false for bearish
    CHeikinAshiCandle *candle;

public:
    CHeikinAshiTrendChangeEvent(string symbol, int timeframe, bool oldTrend, bool newTrend, CHeikinAshiCandle* newCandle);
    bool GetOldTrend() const;
    bool GetNewTrend() const;
    CHeikinAshiCandle* GetCandle() const;
    
    virtual int GetOriginTimeframe() const override;
    virtual string GetDetails() override;
    virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override;
};

// CHeikinAshiTrendChangeEvent Class Implementation
CHeikinAshiTrendChangeEvent::CHeikinAshiTrendChangeEvent(string symbol, int timeframe, bool oldTrend, bool newTrend, CHeikinAshiCandle* newCandle)
    : CEvent(symbol, EV_HEIKINASHI_TREND_CHANGE),
      m_timeframe(timeframe),
      oldTrend(oldTrend),
      newTrend(newTrend),
      candle(newCandle) {}

bool CHeikinAshiTrendChangeEvent::GetOldTrend() const { return oldTrend; }
bool CHeikinAshiTrendChangeEvent::GetNewTrend() const { return newTrend; }
CHeikinAshiCandle* CHeikinAshiTrendChangeEvent::GetCandle() const { return candle; }

int CHeikinAshiTrendChangeEvent::GetOriginTimeframe() const {
    return m_timeframe; 
}

string CHeikinAshiTrendChangeEvent::GetDetails() {
    string result;
    result = getSymbol() + "." + CChartHelper::GetTimeframeName(candle.timeframe) + 
             ": Heikin-Ashi Trend Change at " + CHelper::TimeToString(candle.openTime) +                  
             ". Old trend: " + (oldTrend ? "Bullish" : "Bearish") + 
             ", New trend: " + (newTrend ? "Bullish" : "Bearish");
    return result;
}

ENUM_MARKET_DIRECTION CHeikinAshiTrendChangeEvent::GetMarketDirection() const { 
    return newTrend ? MARKET_DIRECTION_BULLISH : MARKET_DIRECTION_BEARISH;
}

#endif


