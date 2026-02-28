//+------------------------------------------------------------------+
//|                                         PriceActionEvent.mqh |
//|                                   Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef PRICE_ACTION_EVENT_MQH
#define PRICE_ACTION_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\Candle.mqh>
#include <Expert\ChartHelper.mqh>

// CPriceActionEvent Class Definition
class CPriceActionEvent : public CEvent {
private:
    CCandle* m_currentCandle;
    CCandle* m_previousCandle;
    ENUM_MARKET_DIRECTION m_direction;
    
public:
    CPriceActionEvent(string symbol, ENUM_EVENT_TYPE eventType, 
                            CCandle* currentCandle, CCandle* previousCandle,
                            ENUM_MARKET_DIRECTION direction);
    ~CPriceActionEvent();
    
    CCandle* GetCurrentCandle() const { return m_currentCandle; }
    CCandle* GetPreviousCandle() const { return m_previousCandle; }
    
    virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override;
    virtual string GetDetails() override;
    virtual int GetOriginTimeframe() const override;
};

// CPriceActionEvent Implementation
CPriceActionEvent::CPriceActionEvent(string symbol, ENUM_EVENT_TYPE eventType, 
                                   CCandle* currentCandle, CCandle* previousCandle,
                                   ENUM_MARKET_DIRECTION direction) 
    : CEvent(symbol, eventType) {
    m_currentCandle = currentCandle;
    m_previousCandle = previousCandle;
    m_direction = direction;
}

CPriceActionEvent::~CPriceActionEvent() {
    // Keine Notwendigkeit, die Candle-Objekte hier zu löschen,
    // da sie von der Chart-Klasse verwaltet werden
}

ENUM_MARKET_DIRECTION CPriceActionEvent::GetMarketDirection() const {
    return m_direction;
}

string CPriceActionEvent::GetDetails() {
    string directionStr = (m_direction == MARKET_DIRECTION_BULLISH) ? "Bullish" : "Bearish";
    string eventTypeStr = (type == EV_PRICE_ACTION_REVERSAL) ? "" : "Potential ";
    
    return StringFormat("%s: Price Action %s%s Reversal at %s, Timeframe: %s", 
                        getSymbol() + "." + CChartHelper::GetTimeframeName(m_previousCandle.timeframe),                        
                        eventTypeStr,
                        directionStr,
                        TimeToString(m_currentCandle.openTime, TIME_DATE|TIME_MINUTES),
                        CChartHelper::GetTimeframeName(m_currentCandle.timeframe));
}

int CPriceActionEvent::GetOriginTimeframe() const {
    return m_previousCandle.timeframe;
}

#endif // PRICE_ACTION_EVENT_MQH


