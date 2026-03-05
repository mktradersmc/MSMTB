//+------------------------------------------------------------------+
//|                                           SessionStatusEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property strict

#ifndef SESSION_STATUS_EVENT_MQH
#define SESSION_STATUS_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\Session.mqh>

class CSessionStatusEvent : public CEvent
{  
private:
   CSession* m_session;
   
public:
   CSessionStatusEvent(string symbol, ENUM_EVENT_TYPE eventType, CSession* session) : CEvent(symbol, eventType), m_session(session) {
   }
   ~CSessionStatusEvent() {};
   
   CSession* GetSession()
   {
      return m_session;
   }
   
   virtual string GetDetails() {
       string result;
       string status = "started";
       string additionalInfo = "";
       datetime time = m_session.startTime;
       
       if (getEventType()==EV_SESSION_ENDED)
       {
         status = "ended";
         time = m_session.endTime;
         additionalInfo = ". Session High = "+NormalizeDouble(m_session.sessionHigh,Digits())+", Session Low = "+NormalizeDouble(m_session.sessionLow,Digits());
       }
       result = getSymbol()+": Session "+m_session.name+" "+status+" at "+CHelper::TimeToString(time)+additionalInfo+". Keylevel = "+m_session.keyLevel+". Trading = "+m_session.trading;
       
       return result;
   }
};

#endif


