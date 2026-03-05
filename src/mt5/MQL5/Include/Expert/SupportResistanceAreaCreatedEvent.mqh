//+------------------------------------------------------------------+
//|                          SupportResistanceAreaCreatedEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef SUPPORT_RESISTANCE_AREA_CREATED_EVENT_MQH
#define SUPPORT_RESISTANCE_AREA_CREATED_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\SupportResistanceArea.mqh>
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

// CSupportResistanceAreaCreatedEvent Implementation
CSupportResistanceAreaCreatedEvent::CSupportResistanceAreaCreatedEvent(string symbol, CSupportResistanceArea* area)
  : CEvent(symbol, EV_SRAREA_CREATED)
{
    m_area = area;
}

CSupportResistanceAreaCreatedEvent::~CSupportResistanceAreaCreatedEvent()
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
    return StringFormat("CSupportResistanceAreaCreatedEvent: %s on %s", 
                       GetDetails(), CChartHelper::GetTimeframeName(GetOriginTimeframe()));
}

#endif // SUPPORT_RESISTANCE_AREA_CREATED_EVENT_MQH

