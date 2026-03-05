//+------------------------------------------------------------------+
//|                                        PriceLevelBrokenEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#include <Expert\Event.mqh>
#include <Expert\PriceLevel.mqh>
#include <Expert\ChartHelper.mqh>

#ifndef PRICE_LEVEL_BROKEN_EVENT_MQH
#define PRICE_LEVEL_BROKEN_EVENT_MQH

// CPriceLevelBrokenEvent Class Definition
class CPriceLevelBrokenEvent : public CEvent
{
private:
   CPriceLevel* m_priceLevel;
   CCandle* m_breakCandle;
   
public:
   CPriceLevelBrokenEvent(string symbol, ENUM_EVENT_TYPE eventType, CPriceLevel* priceLevel, CCandle* breakCandle);
   ~CPriceLevelBrokenEvent();
   
   CPriceLevel* GetPriceLevel() const;
   CCandle* GetBreakerCandle() const;
   
   string toString();
   virtual string GetDetails() override;
   virtual int GetOriginTimeframe() const override;
};

// CPriceLevelBrokenEvent Class Implementation
CPriceLevelBrokenEvent::CPriceLevelBrokenEvent(string symbol, ENUM_EVENT_TYPE eventType, CPriceLevel* priceLevel, CCandle* breakCandle) 
   : CEvent(symbol, eventType), m_priceLevel(priceLevel), m_breakCandle(breakCandle) {}

CPriceLevelBrokenEvent::~CPriceLevelBrokenEvent() {}

CPriceLevel* CPriceLevelBrokenEvent::GetPriceLevel() const { return m_priceLevel; }
CCandle* CPriceLevelBrokenEvent::GetBreakerCandle() const { return m_breakCandle; }

string CPriceLevelBrokenEvent::toString() {
   string result;
   string type;
   switch(GetPriceLevel().GetType())
   {
      case LEVEL_SESSION: type = "Session (" + GetPriceLevel().GetSession().name + ")"; break;
      case LEVEL_DAILY: type = "Daily ("+CHelper::TimeToDayString(m_priceLevel.GetTime())+")"; break;
      case LEVEL_WEEKLY: type = "Weekly ("+CHelper::TimeToDayString(m_priceLevel.GetTime())+")"; break;
      case LEVEL_MONTHLY: type = "Monthly ("+CHelper::TimeToDayString(m_priceLevel.GetTime())+")"; break;
   }
   
   result = getSymbol() + "." + CChartHelper::GetTimeframeName(m_breakCandle.timeframe) + ": " + 
            type + " " + (GetPriceLevel().GetDirection() == LEVEL_HIGH ? "High" : "Low") + " Level";
   
   if (m_breakCandle != NULL) {
      string breakType = "Unknown";
      
      switch(getEventType())
      {
         case EV_HIGH_LEVEL_BROKEN:
         case EV_LOW_LEVEL_BROKEN:
            breakType = "Broken";
            break;
         case EV_HIGH_LEVEL_SWEPT:
         case EV_LOW_LEVEL_SWEPT:
            breakType = "Swept";
            break;
         case EV_HIGH_LEVEL_MITIGATED:
         case EV_LOW_LEVEL_MITIGATED:
            breakType = "Mitigated";
      }
         
      result += " " + breakType + " by candle (" + IntegerToString(m_breakCandle.id) + ") at " + 
                CHelper::TimeToString(m_breakCandle.openTime);
   }
   
   return result;
}
    
string CPriceLevelBrokenEvent::GetDetails() 
{         
    return toString() + "," + m_breakCandle.toString();
}
    
int CPriceLevelBrokenEvent::GetOriginTimeframe() const {
    return m_breakCandle.timeframe; 
}

#endif


