//+------------------------------------------------------------------+
//|                                              CFetchHistory.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property strict

#include "..\CBaseCommand.mqh"
#include "..\Indicators\HistoryService.mqh"
#include <JAson.mqh>

class CFetchHistory : public CBaseCommand
{
private:
   CHistoryService* m_service;
public:
   CFetchHistory(CHistoryService* service) { m_service = service; }

   virtual string Name() { return "CMD_FETCH_HISTORY"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
      if(m_service == NULL) return false;
      
      // Synchronous Call
      // HandleFetchHistory now populates responsePayload directly (status, data, etc.)
      return m_service.HandleFetchHistory(payload, responsePayload);
   }
};
