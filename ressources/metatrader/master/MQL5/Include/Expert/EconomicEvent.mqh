//+------------------------------------------------------------------+
//|                                                EconomicEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef ECONOMIC_EVENT_MQH
#define ECONOMIC_EVENT_MQH

#include <Object.mqh>

// CEconomicEvent Class Definition
class CEconomicEvent : public CObject
{
public:
   string name;
   datetime time;
   string country;
   string currency;
   int impact;

   CEconomicEvent(string eventName, datetime eventTime, string eventCountry, string eventCurrency, int eventImpact);
   ~CEconomicEvent();
   string toString();
};

// CEconomicEvent Class Implementation
CEconomicEvent::CEconomicEvent(string eventName, datetime eventTime, string eventCountry, string eventCurrency, int eventImpact)
{
   name = eventName;
   time = eventTime;
   country = eventCountry;
   currency = eventCurrency;
   impact = eventImpact;
}

CEconomicEvent::~CEconomicEvent()
{
}

string CEconomicEvent::toString()
{
   string result;
   
   result = "Name: " + name + ", Uhrzeit: " + TimeToString(time, TIME_DATE | TIME_MINUTES) + 
            ", Land: " + country + ", Währung: " + currency + ", Impact: " + IntegerToString(impact);
   
   return result;
}

#endif
