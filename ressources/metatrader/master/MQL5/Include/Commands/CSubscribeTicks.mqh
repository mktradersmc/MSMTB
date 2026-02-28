//+------------------------------------------------------------------+
//|                                              CSubscribeTicks.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property strict

#include "..\CBaseCommand.mqh"
#include "..\Expert\DatafeedServices.mqh"
#include <JAson.mqh>

class CSubscribeTicks : public CBaseCommand
{
private:
   CDatafeedServices* m_services;
public:
   CSubscribeTicks(CDatafeedServices* services) { m_services = services; }
   
   virtual string Name() { return "CMD_SUBSCRIBE_TICKS"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
      if(m_services == NULL) return false;
      
      // Logic encapsulated in DatafeedServices
      CJAVal wrapper;
      wrapper["content"].Set(payload);
      m_services.HandleCommand("CMD_SUBSCRIBE_TICKS", wrapper);
      
      // Response? Usually async or void.
      responsePayload["status"] = "OK";
      return true;
   }
};
