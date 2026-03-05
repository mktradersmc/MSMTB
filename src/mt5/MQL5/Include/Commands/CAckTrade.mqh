//+------------------------------------------------------------------+
//|                                                 CAckTrade.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property strict

#include "..\CBaseCommand.mqh"
#include "..\Expert\TradingExpert.mqh"
#include <JAson.mqh>

class CAckTrade : public CBaseCommand
{
private:
   CTradingExpert* m_service;
public:
   CAckTrade(CTradingExpert* service) { m_service = service; }

   virtual string Name() { return "CMD_ACK_TRADE"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
      if(m_service == NULL) return false;
      if(!Validate("id", payload)) return false;
      
      m_service.HandleAckTrade(payload);
      
      responsePayload["status"] = "OK";
      return true;
   }
};
