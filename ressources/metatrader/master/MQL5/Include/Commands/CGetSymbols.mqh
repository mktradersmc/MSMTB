//+------------------------------------------------------------------+
//|                                                  CGetSymbols.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property strict

#include "..\CBaseCommand.mqh"
#include "..\Expert\DatafeedServices.mqh"
#include <JAson.mqh>

class CGetSymbols : public CBaseCommand
{
private:
   CDatafeedServices* m_services;
public:
   CGetSymbols(CDatafeedServices* services) { m_services = services; }
   
   virtual string Name() { return "CMD_GET_SYMBOLS"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
       if(m_services == NULL) return false;

       Print("[CGetSymbols] 🚀 Executing CMD_GET_SYMBOLS (Sync RPC)...");
       
       CJAVal wrapper; // Empty content usually
       
       // Call Service and Capture Return
       CJAVal result = m_services.HandleGetSymbolsCommand(wrapper);
       
       // STANDARD RESPONSE: Explicitly set "content" 
       // Do NOT use Copy() on root as it creates weird "" keys
       if (result.HasKey("content")) {
            responsePayload["content"].Set(result["content"]);
       } else {
            responsePayload["content"].Set(result); // Fallback if service returns raw array
       }
       
       // Explicit Status
       responsePayload["status"] = "OK";
       
       return true; 
   }
};
