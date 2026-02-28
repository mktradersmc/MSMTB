//+------------------------------------------------------------------+
//|                                       PriceLevelCreatedEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef PRICE_LEVEL_CREATED_EVENT_MQH
#define PRICE_LEVEL_CREATED_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\PriceLevel.mqh>
#include <Expert\Helper.mqh>
#include <Expert\ChartHelper.mqh>

class CPriceLevelCreatedEvent : public CEvent
{
private:
   CPriceLevel* m_priceLevel;
   
public:
   CPriceLevelCreatedEvent(string symbol, ENUM_EVENT_TYPE eventType, CPriceLevel* priceLevel) 
      : CEvent(symbol, eventType), m_priceLevel(priceLevel) {}
   
   ~CPriceLevelCreatedEvent() {}
   
   CPriceLevel* GetPriceLevel() const { return m_priceLevel; }
   
   string toString() {
      string result;
      string type;
      switch(m_priceLevel.GetType())
      {
         case LEVEL_SESSION: type = "Session"; break;
         case LEVEL_DAILY: type = "Daily"; break;
         case LEVEL_WEEKLY: type = "Weekly"; break;
         case LEVEL_MONTHLY: type = "Monthly"; break;
      }
      
      result = StringFormat("%s.%s: New %s%s %s Level created at %.5f", 
                            getSymbol(),
                            CChartHelper::GetTimeframeName(GetOriginTimeframe()),
                            type,
                            m_priceLevel.GetType() == LEVEL_SESSION?" ("+m_priceLevel.GetSession().name+")":"",
                            m_priceLevel.GetDirection() == LEVEL_HIGH ? "High" : "Low",
                            m_priceLevel.GetPrice());
 
      return result;
   }
    
   virtual string GetDetails() {
      return toString();
   }
};

#endif


