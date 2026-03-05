//+------------------------------------------------------------------+
//|                                               NewCandleEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef HIGHLOW_BROKEN_EVENT_MQH
#define HIGHLOW_BROKEN_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\HighLow.mqh>
#include <Expert\Candle.mqh>
#include <Expert\ChartHelper.mqh>

// CHighLowBrokenEvent Class Definition (continued)
class CHighLowBrokenEvent : public CEvent
{
private:
   CHighLow* m_highLow;
   CCandle* m_breakCandle;
   
public:
   CHighLowBrokenEvent(string symbol, ENUM_EVENT_TYPE eventType, CHighLow* highLow, CCandle* breakCandle);
   ~CHighLowBrokenEvent();
   
   CHighLow* GetHighLow() const;
   CCandle* GetBreakerCandle() const;
   
   string toString();
   virtual string GetDetails() override;
   virtual int GetOriginTimeframe() const override;
   virtual int GetTargetTimeframe() const override;
};

// CHighLowBrokenEvent Class Implementation
CHighLowBrokenEvent::CHighLowBrokenEvent(string symbol, ENUM_EVENT_TYPE eventType, CHighLow* highLow, CCandle* breakCandle) 
   : CEvent(symbol, eventType), m_highLow(highLow), m_breakCandle(breakCandle) {}

CHighLowBrokenEvent::~CHighLowBrokenEvent() {}

CHighLow* CHighLowBrokenEvent::GetHighLow() const { return m_highLow; }
CCandle* CHighLowBrokenEvent::GetBreakerCandle() const { return m_breakCandle; }

string CHighLowBrokenEvent::toString() {
   string result;
   string type;
   switch(GetHighLow().getType())
   {
      case HL_FRACTAL: type = "fractal"; break;
      case HL_REGULAR: type = "regular"; break;
      case HL_WILLIAMS: type = "williams"; break;
   }
   
   result = getSymbol()+"."+CChartHelper::GetTimeframeName(m_breakCandle.timeframe)+": HighLow ("+StringFormat("#%d", GetHighLow().getId())+") ";  // ID am Anfang des Strings
   result += CHelper::TimeToString(GetHighLow().getSwingCandle().openTime)+" "+type+" "+(GetHighLow().isHigh()?"High":"Low");
   
   if (m_breakCandle != NULL) {
      string breakType = "Unknown";
      
      switch(getEventType())
      {
         case EV_HIGH_BROKEN:
         case EV_LOW_BROKEN:
            breakType = "Broken";
            break;
         case EV_HIGH_SWEPT:
         case EV_LOW_SWEPT:
            breakType = "Swept";
            break;
         case EV_HIGH_MITIGATED:
         case EV_LOW_MITIGATED:
            breakType = "Mitigated";
      }
      
      result += " "+breakType+" by candle ("+m_breakCandle.id+") at "+CHelper::TimeToString(m_breakCandle.openTime);
   }
   
   return result;
}

string CHighLowBrokenEvent::GetDetails() 
{         
    return toString();
}

int CHighLowBrokenEvent::GetOriginTimeframe() const {
    return m_breakCandle.timeframe; 
}

int CHighLowBrokenEvent::GetTargetTimeframe() const {
    return m_highLow.getSwingCandle().timeframe;
}

#endif


