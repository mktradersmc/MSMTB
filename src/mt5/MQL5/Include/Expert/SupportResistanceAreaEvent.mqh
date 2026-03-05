//+------------------------------------------------------------------+
//|                                  SupportResistanceAreaEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef SUPPORT_RESISTANCE_AREA_EVENT_MQH
#define SUPPORT_RESISTANCE_AREA_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\SupportResistanceArea.mqh>
#include <Expert\Candle.mqh>
#include <Expert\ChartHelper.mqh>
#include <Expert\LogManager.mqh>

// CSupportResistanceAreaEvent Class Definition - generisches Event für alle Änderungen
class CSupportResistanceAreaEvent : public CEvent
{
private:
   CSupportResistanceArea* m_area;
   CCandle* m_triggerCandle;
   string m_details;

public:
   CSupportResistanceAreaEvent(ENUM_EVENT_TYPE eventType, string symbol, CSupportResistanceArea* area, CCandle* triggerCandle = NULL, string details = "");
   ~CSupportResistanceAreaEvent();
   
   CSupportResistanceArea* GetArea() const;
   CCandle* GetTriggerCandle() const;
   virtual string GetDetails() override;
   string toString();
};

// CSupportResistanceAreaEvent Implementation
CSupportResistanceAreaEvent::CSupportResistanceAreaEvent(ENUM_EVENT_TYPE eventType, string symbol, CSupportResistanceArea* area, CCandle* triggerCandle, string details)
  : CEvent(symbol, eventType)
{
    m_area = area;
    m_triggerCandle = triggerCandle;
    m_details = details;
}

CSupportResistanceAreaEvent::~CSupportResistanceAreaEvent()
{
    // Note: We don't delete objects here as they're managed elsewhere
}

CSupportResistanceArea* CSupportResistanceAreaEvent::GetArea() const { return m_area; }
CCandle* CSupportResistanceAreaEvent::GetTriggerCandle() const { return m_triggerCandle; }

string CSupportResistanceAreaEvent::GetDetails()
{
    if(m_area == NULL) return "Invalid area";
    if(m_details != "") 
        return StringFormat("Area ID: %d - %s", m_area.GetUniqueId(), m_details);
    else
        return StringFormat("Area ID: %d", m_area.GetUniqueId());
}

string CSupportResistanceAreaEvent::toString()
{
    return StringFormat("CSupportResistanceAreaEvent (%s): %s", GetEventName(), GetDetails());
}

#endif // SUPPORT_RESISTANCE_AREA_EVENT_MQH

