//+------------------------------------------------------------------+
//|                                     MarketStructureEvent.mqh     |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef MARKET_STRUCTURE_EVENT_MQH
#define MARKET_STRUCTURE_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\HighLow.mqh>
#include <Expert\Candle.mqh>

class CMarketStructureEvent : public CEvent {
private:
    CHighLow* m_highLow;
    CCandle* m_breakCandle;
    ENUM_MARKET_DIRECTION m_direction;
    
public:
    CMarketStructureEvent(string symbol, ENUM_EVENT_TYPE eventType, 
                         CHighLow* highLow, CCandle* breakCandle,
                         ENUM_MARKET_DIRECTION direction)
        : CEvent(symbol, eventType), 
          m_highLow(highLow),
          m_breakCandle(breakCandle),
          m_direction(direction) {}
    
    virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override { return m_direction; }
    CHighLow* GetHighLow() const { return m_highLow; }
    CCandle* GetBreakCandle() const { return m_breakCandle; }
    
    virtual string GetDetails() override {
        return getSymbol() + "." + CChartHelper::GetTimeframeName(m_breakCandle.timeframe) + ": "+StringFormat("%s %s Structure [%s] at %s, triggered by break at %s",
            m_direction == MARKET_DIRECTION_BULLISH ? "Bullish" : "Bearish",
            CChartHelper::GetTimeframeName(m_highLow.getSwingCandle().timeframe),
            type == EV_MARKET_STRUCTURE_BOS ? "BOS" : "CHoCH",
            TimeToString(m_highLow.getSwingCandle().openTime),
            TimeToString(m_breakCandle.openTime));
    }
    
    virtual int GetOriginTimeframe() const override { return m_breakCandle.timeframe; }
    virtual int GetTargetTimeframe() const override { return m_highLow.getSwingCandle().timeframe; }
};

#endif


