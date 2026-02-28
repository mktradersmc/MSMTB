//+------------------------------------------------------------------+
//|                                            CUnsubscribeTicks.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property strict

#include "..\CBaseCommand.mqh"
#include "..\Expert\DatafeedServices.mqh"
#include <JAson.mqh>

class CUnsubscribeTicks : public CBaseCommand
{
private:
   CDatafeedServices* m_services;
public:
   CUnsubscribeTicks(CDatafeedServices* services) { m_services = services; }
   
   virtual string Name() { return "CMD_UNSUBSCRIBE_TICKS"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
      if(m_services == NULL) return false;
      
      CJAVal wrapper;
      wrapper["content"].Set(payload);
      m_services.HandleCommand("CMD_UNSUBSCRIBE_TICKS", wrapper);
      
      responsePayload["status"] = "OK";
      return true;
   }
};
