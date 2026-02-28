//+------------------------------------------------------------------+
//|                                         ImbalanceStatusEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.01"
#property strict

#ifndef IMBALANCE_STATUS_EVENT_MQH
#define IMBALANCE_STATUS_EVENT_MQH
#include <Expert\Event.mqh>
#include <Expert\Imbalance.mqh>
#include <Expert\Globals.mqh>
#include <Expert\ChartHelper.mqh>
// CImbalanceStatusEvent Class Definition
class CImbalanceStatusEvent : public CEvent
{
private:
   CImbalance* m_imbalance;
   CCandle* m_triggerCandle;
   string description;
   ENUM_MARKET_DIRECTION direction;
   bool m_isUnmitigated;

public:
   CImbalanceStatusEvent(string symbol, ENUM_EVENT_TYPE eventType, CImbalance* imbalance, CCandle* triggerCandle, bool isUnmitigated);
   ~CImbalanceStatusEvent();
   CImbalance* GetImbalance() const;
   CCandle* GetTriggerCandle() const;
   string toString();
   
   bool IsUnmitigated() const { return m_isUnmitigated; }
   
   virtual string GetDetails() override;
   virtual int GetOriginTimeframe() const override;
   virtual int GetTargetTimeframe() const override;
   virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override;
};

// CImbalanceStatusEvent Class Implementation
CImbalanceStatusEvent::CImbalanceStatusEvent(string symbol, ENUM_EVENT_TYPE eventType, CImbalance* imbalance, CCandle* triggerCandle, bool isUnmitigated) 
   : CEvent(symbol, eventType), m_imbalance(imbalance), m_triggerCandle(triggerCandle), m_isUnmitigated(isUnmitigated) {
   string eventName;
   switch(type) {
      case EV_IMBALANCE_ENTERED: eventName = "Entered"; break;
      case EV_IMBALANCE_LEFT: eventName = "Left"; break;
      case EV_IMBALANCE_MITIGATED: eventName = "Mitigated"; break;
      case EV_IMBALANCE_DEACTIVATED: eventName = "Deactivated"; break;
      case EV_IMBALANCE_INVERTED: eventName = "Inverted"; break;
      case EV_IMBALANCE_INVERSION_CONFIRMED: eventName = "Inversion Confirmed"; break;
      case EV_IMBALANCE_MOVEMENT: eventName = "Movement"; break;
      case EV_INVERTED_IMBALANCE_ENTERED: eventName = "Entered"; break;
      case EV_INVERTED_IMBALANCE_LEFT: eventName = "Left"; break;
      case EV_INVERTED_IMBALANCE_MITIGATED: eventName = "Mitigated"; break;
      case EV_INVERTED_IMBALANCE_MOVEMENT: eventName = "Movement"; break;
      case EV_IMBALANCE_DISRESPECTED: eventName = "Disrespected"; break;
      default: eventName = "Unknown";
   }
   
   direction = m_imbalance.type==BULLISH ? MARKET_DIRECTION_BULLISH : MARKET_DIRECTION_BEARISH;
   
   description = symbol+"."+CChartHelper::GetTimeframeName(m_imbalance.timeframe)+": "+m_imbalance.toString()+
      StringFormat(" %s by %s Trigger Candle at %s%s",          
      eventName,
      CChartHelper::GetTimeframeName(m_triggerCandle.timeframe),
      CHelper::TimeToString(m_triggerCandle.openTime),
      m_isUnmitigated ? " (Unmitigated)" : "");   
}

CImbalanceStatusEvent::~CImbalanceStatusEvent() {}
CImbalance* CImbalanceStatusEvent::GetImbalance() const { return m_imbalance; }
CCandle* CImbalanceStatusEvent::GetTriggerCandle() const { return m_triggerCandle; }

string CImbalanceStatusEvent::toString() {
   return description;
}

string CImbalanceStatusEvent::GetDetails() {
    return toString();
}

int CImbalanceStatusEvent::GetOriginTimeframe() const {
    return m_triggerCandle.timeframe;
}

int CImbalanceStatusEvent::GetTargetTimeframe() const {
    return m_imbalance.timeframe;
}

ENUM_MARKET_DIRECTION CImbalanceStatusEvent::GetMarketDirection() const { 
   return direction;
}
#endif

