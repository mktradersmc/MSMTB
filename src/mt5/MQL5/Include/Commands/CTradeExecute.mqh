//+------------------------------------------------------------------+
//|                                                CTradeExecute.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property link      "https://www.mql5.com"
#property strict

#include "..\CBaseCommand.mqh"
#include <Expert\TradingExpert.mqh> 

// Forward declaration via include interaction or assume implementation in Expert
// Since this is included inside Expert, we might need access to Expert instance "expert"
// Or we invoke method on global expert object?
// Better: Return parsed parameters in response, and let Manager invoke method?
// No, the Command Pattern usually executes logic.
// HOWEVER, MQL5 include order is tricky.
// We can use a reference to the implementation or callback.
// For now, let's assume global access to 'expert' object declared in .mq5 file
// extern CTradingExpert expert; 

extern CTradingExpert expert;

class CTradeExecute : public CBaseCommand
{
public:
   virtual string Name() { return "CMD_EXECUTE_TRADE"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
      // Basic Validation
      // Validation now handled inside Expert logic for centralized response
      
      // Delegate to Expert Logic (Synchronous)
      expert.ExecuteTrade(*payload, responsePayload);
      
      // Response is now populated by Expert logic
      string statusStr = responsePayload.HasKey("status") ? responsePayload["status"].ToStr() : "";
      if (statusStr == "ERROR" || statusStr == "REJECTED") {
          m_error = responsePayload.HasKey("message") ? responsePayload["message"].ToStr() : "Unknown Error";
          return false;
      }
      
      return true;
   }
};
