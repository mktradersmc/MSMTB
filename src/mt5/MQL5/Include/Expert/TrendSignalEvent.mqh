//+------------------------------------------------------------------+
//|                                             TrendSignalEvent.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "1.00"

#ifndef TREND_SIGNAL_EVENT_MQH
#define TREND_SIGNAL_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\Candle.mqh>
#include <Expert\ChartHelper.mqh>

class CTrendSignalEvent : public CEvent
{
private:
    CCandle* m_candle;
    
public:
    CTrendSignalEvent(string symbol, ENUM_EVENT_TYPE eventType, CCandle* candle);
    ~CTrendSignalEvent();
    
    CCandle* GetCandle();
    virtual string GetDetails() override;
    virtual int GetOriginTimeframe() const override;
    virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override;
};

CTrendSignalEvent::CTrendSignalEvent(string symbol, ENUM_EVENT_TYPE eventType, CCandle* candle) 
    : CEvent(symbol, eventType), m_candle(candle) {}
    
CTrendSignalEvent::~CTrendSignalEvent() {}

CCandle* CTrendSignalEvent::GetCandle() { 
    return m_candle; 
}

ENUM_MARKET_DIRECTION CTrendSignalEvent::GetMarketDirection() const { 
    return getEventType() == EV_TREND_CHANGE_BULLISH || getEventType() == EV_TREND_BULLISH_ENTRY_SIGNAL? MARKET_DIRECTION_BULLISH : MARKET_DIRECTION_BEARISH;
}    

string CTrendSignalEvent::GetDetails() {
    string signalType;
    switch(getEventType()) {
        case EV_TREND_CHANGE_BULLISH: signalType = "Bullish Trend Change"; break;
        case EV_TREND_CHANGE_BEARISH: signalType = "Bearish Trend Change"; break;
        case EV_TREND_BULLISH_ENTRY_SIGNAL: signalType = "Bullish Trend Entry Signal"; break;
        case EV_TREND_BEARISH_ENTRY_SIGNAL: signalType = "Bearish Trend Entry Signal"; break;
        default: signalType = "Unknown Signal";
    }
    
    return getSymbol() + "." + CChartHelper::GetTimeframeName(m_candle.timeframe) + 
           ": " + signalType + " at " + TimeToString(m_candle.openTime);
}

int CTrendSignalEvent::GetOriginTimeframe() const {
    return m_candle.timeframe;
}

#endif

