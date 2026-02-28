//+------------------------------------------------------------------+
//|                                        MarketReversalEvent.mqh |
//|                                  Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef MARKET_REVERSAL_EVENT_MQH
#define MARKET_REVERSAL_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\SignalEvent.mqh>
#include <Expert\Candle.mqh>

class CMarketReversalEvent : public CSignalEvent 
{
private:
    CCandle* m_pivotCandle;       
    CCandle* m_referenceCandle;   
    CCandle* m_triggerCandle;     
    bool m_isBullish;             

public:
    CMarketReversalEvent(string symbol, CCandle* pivotCandle, CCandle* referenceCandle, 
                        CCandle* triggerCandle, bool isBullish);
    ~CMarketReversalEvent();
    
    CCandle* GetPivotCandle() const { return m_pivotCandle; }
    CCandle* GetReferenceCandle() const { return m_referenceCandle; }
    CCandle* GetTriggerCandle() const { return m_triggerCandle; }
    double GetEntryPrice() const { return m_referenceCandle.open; }
    double GetStopLoss() const { return m_isBullish ? m_pivotCandle.low : m_pivotCandle.high; }

    virtual string GetDetails() override;
    virtual int GetOriginTimeframe() const override { return m_triggerCandle.timeframe; }
    
    virtual void FillTradeSignal(CTradeSignal& signal) const override
    {
        // Erst die Parent-Implementation aufrufen
        CSignalEvent::FillTradeSignal(signal);
        
        if(m_isBullish)
        {
            signal.m_entryPrice = m_referenceCandle.open;
            signal.m_stopLoss = m_pivotCandle.low;
        }
        else
        {
            signal.m_entryPrice = m_referenceCandle.open;
            signal.m_stopLoss = m_pivotCandle.high;
        }
    }
    virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override 
    { 
        return m_isBullish ? MARKET_DIRECTION_BULLISH : MARKET_DIRECTION_BEARISH;
    }
};

CMarketReversalEvent::CMarketReversalEvent(string symbol, CCandle* pivotCandle, 
    CCandle* referenceCandle, CCandle* triggerCandle, bool isBullish)
    : CSignalEvent(
        symbol, 
        EV_MARKET_REVERSAL,
        isBullish ? referenceCandle.high : referenceCandle.low,  // Entry Price
        isBullish ? pivotCandle.low : pivotCandle.high,  // Stop Loss
        0,  // Take Profit - eventuell später ergänzen
        EV_EMPTY  // Close Event Type - eventuell später ergänzen
    ),
    m_pivotCandle(pivotCandle),
    m_referenceCandle(referenceCandle),
    m_triggerCandle(triggerCandle),
    m_isBullish(isBullish)
{
}

CMarketReversalEvent::~CMarketReversalEvent()
{
}

string CMarketReversalEvent::GetDetails()
{
    return StringFormat("%s: %s Market Reversal triggered at %s: Reference Candle from %s Open %.5f, PivotCandle at %s, Stop Loss %.5f", 
        m_symbol+"."+CChartHelper::GetTimeframeName(m_triggerCandle.timeframe),
        m_isBullish ? "Bullish" : "Bearish",
        CHelper::TimeToString(m_triggerCandle.closeTime),
        CHelper::TimeToString(m_referenceCandle.openTime),
        CHelper::TimeToString(m_pivotCandle.openTime),
        GetEntryPrice(),
        GetStopLoss());
}

#endif


