//+------------------------------------------------------------------+
//|                                              CGetInitialData.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property strict

#include "..\CBaseCommand.mqh"
#include <JAson.mqh>
#include "..\Indicators\TickSpyService.mqh"

class CGetInitialData : public CBaseCommand
{
private:
   CTickSpyService* m_service;
public:
   CGetInitialData(CTickSpyService* service) { m_service = service; }
   
   virtual string Name() { return "CMD_GET_INITIAL_DATA"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
      if(m_service == NULL) return false;
      m_service.ProcessInitialDataCommand(payload);
      responsePayload["status"] = "OK";
      return true;
   }
};
