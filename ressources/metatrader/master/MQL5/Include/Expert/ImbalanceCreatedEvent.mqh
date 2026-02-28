//+------------------------------------------------------------------+
//|                                        ImbalanceCreatedEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef IMBALANCE_CREATED_EVENT_MQH
#define IMBALANCE_CREATED_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\Imbalance.mqh>
#include <Expert\ChartHelper.mqh>

// CImbalanceCreatedEvent Class Definition
class CImbalanceCreatedEvent : public CEvent
{
private:
   CImbalance* m_imbalance;

public:
   CImbalanceCreatedEvent(string symbol, CImbalance* imbalance);
   ~CImbalanceCreatedEvent();
   
   CImbalance* GetImbalance() const;
   string toString();
   virtual string GetDetails() override;
   virtual int GetOriginTimeframe() const override;
   virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override;
};

// CImbalanceCreatedEvent Class Implementation
CImbalanceCreatedEvent::CImbalanceCreatedEvent(string symbol, CImbalance* imbalance) 
   : CEvent(symbol, EV_IMBALANCE_CREATED), m_imbalance(imbalance) {}

CImbalanceCreatedEvent::~CImbalanceCreatedEvent() {}

CImbalance* CImbalanceCreatedEvent::GetImbalance() const { 
   return m_imbalance; 
}

string CImbalanceCreatedEvent::toString() {
   return StringFormat(getSymbol() + "." + CChartHelper::GetTimeframeName(m_imbalance.timeframe) + 
                       ": %s Imbalance created at %s, High: %.5f, Low: %.5f", 
      m_imbalance.type == BULLISH ? "Bullish" : "Bearish",
      CHelper::TimeToString(m_imbalance.associatedCandle.openTime),
      m_imbalance.originalGapHigh,
      m_imbalance.originalGapLow);
}

string CImbalanceCreatedEvent::GetDetails() {
    return toString();
}

int CImbalanceCreatedEvent::GetOriginTimeframe() const {
    return m_imbalance.timeframe;
}

ENUM_MARKET_DIRECTION CImbalanceCreatedEvent::GetMarketDirection() const { 
   return m_imbalance.type == BULLISH ? MARKET_DIRECTION_BULLISH : MARKET_DIRECTION_BEARISH;
}

#endif

