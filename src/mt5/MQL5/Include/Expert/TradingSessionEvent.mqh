//+------------------------------------------------------------------+
//|                                          TradingSessionEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property strict

#ifndef TRADING_SESSION_EVENT_MQH
#define TRADING_SESSION_EVENT_MQH

#include <Expert\Event.mqh>

class CTradingSessionEvent : public CEvent
{  
public:
   CTradingSessionEvent(string symbol, ENUM_EVENT_TYPE eventType) : CEvent(symbol, eventType) {
   }
   ~CTradingSessionEvent() {};
      
   virtual string GetDetails() {
       string result;
       result = getSymbol()+": Trading Session "+((GetEventName()=="EV_ACTIVATE_TRADING")?"activated":"deactivated");
       return result;
   }
};

#endif


