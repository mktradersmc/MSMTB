//+------------------------------------------------------------------+
//|                                                CConfigSymbols.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property strict

#ifndef CCONFIG_SYMBOLS_MQH
#define CCONFIG_SYMBOLS_MQH

#include "..\CBaseCommand.mqh"
#include "..\Expert\DatafeedServices.mqh"
#include <JAson.mqh>

class CConfigSymbols : public CBaseCommand
{
private:
   CDatafeedServices* m_services;
public:
   CConfigSymbols(CDatafeedServices* services) { m_services = services; }
   
   virtual string Name() { return "CMD_CONFIG_SYMBOLS"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
       if(m_services == NULL) return false;
       
       // HandleConfigSymbolsCommand in DatafeedServices expects msg["content"]
       // But the payload from CCommandManager (via Envelope) IS the content logic (symbols array).
       // We must wrap it to satisfy the legacy service method.
       
       CJAVal wrapper;
       
       // ROBUST WRAPPING: Ensure "content" key exists or root is content
       if (payload != NULL) {
           // If payload is already the content object (has "symbols" or "items")
           if (payload.HasKey("symbols") || payload.HasKey("items")) {
               wrapper["content"].Set(payload);
           } 
           // If payload IS the array of symbols
           else if (payload.m_type == jtARRAY) {
               wrapper["content"].Set(payload);
           }
           // Fallback: Copy all keys
           else {
               wrapper["content"].Set(payload);
           }
       }
       
       Print("[CConfigSymbols] ▶️ Executing Service Logic...");
       // Call Service Directly and Capture Report
       CJAVal report = m_services.HandleConfigSymbolsCommand(wrapper);
       Print("[CConfigSymbols] ◀️ Service Logic Returned. Report Type: ", report["type"].ToStr());
       
       // Populate Response Payload with Full Report
       // FIX: Explicitly set "content" to ensure flat structure.
       // JAson Copy() behavior is inconsistent for root objects.
       if (report.HasKey("content")) {
           responsePayload["content"].Set(report["content"]);
       } 
       
       if (report.HasKey("status")) {
           responsePayload["status"].Set(report["status"]);
       } else {
           responsePayload["status"] = "OK";
       }
       
       // Force Clean Debug Print
       // Print("[CConfigSymbols] Response keys: ", responsePayload.Serialize());
       
       Print("[CConfigSymbols] ✅ Payload Copied. Returning true.");
       
       return true; 
   }
};

#endif
