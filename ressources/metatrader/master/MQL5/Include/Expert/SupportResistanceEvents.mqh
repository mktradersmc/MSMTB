//+------------------------------------------------------------------+
//|                                      SupportResistanceEvents.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef SUPPORT_RESISTANCE_EVENTS_MQH
#define SUPPORT_RESISTANCE_EVENTS_MQH

#include <Expert\Event.mqh>
#include <Expert\SupportResistanceArea.mqh>
#include <Expert\Candle.mqh>
#include <Expert\ChartHelper.mqh>
#include <Expert\LogManager.mqh>

// CSupportResistanceAreaCreatedEvent Class Definition
class CSupportResistanceAreaCreatedEvent : public CEvent
{
private:
   CSupportResistanceArea* m_area;

public:
   CSupportResistanceAreaCreatedEvent(string symbol, CSupportResistanceArea* area);
   ~CSupportResistanceAreaCreatedEvent();
   
   CSupportResistanceArea* GetArea() const;
   virtual string GetDetails() override;
   string toString();
};

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

// Implementation follows...

// CSupportResistanceAreaCreatedEvent Implementation
CSupportResistanceAreaCreatedEvent::CSupportResistanceAreaCreatedEvent(string symbol, CSupportResistanceArea* area)
  : CEvent(symbol, EV_SRAREA_CREATED)
{
    m_area = area;
}

CSupportResistanceAreaCreatedEvent::~CSupportResistanceAreaCreatedEvent();
{
    // Note: We don't delete m_area here as it's managed by the SupportResistanceDetector
}

CSupportResistanceArea* CSupportResistanceAreaCreatedEvent::GetArea() const
{
    return m_area;
}

string CSupportResistanceAreaCreatedEvent::GetDetails()
{
    if(m_area == NULL) return "Invalid area";
    return StringFormat("Area ID: %d, Range: %.5f - %.5f", 
                       m_area.GetUniqueId(), m_area.lowerBound, m_area.upperBound);
}

string CSupportResistanceAreaCreatedEvent::toString()
{
    return StringFormat("SupportResistanceAreaCreatedEvent: %s on %s", 
                       GetDetails(), CChartHelper::GetTimeframeName(GetOriginTimeframe()));
}

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
    return StringFormat("SupportResistanceAreaEvent (%s): %s", GetEventName(), GetDetails());
}

#endif // SUPPORT_RESISTANCE_EVENTS_MQH

