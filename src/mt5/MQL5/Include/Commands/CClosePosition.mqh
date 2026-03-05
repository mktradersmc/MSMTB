//+------------------------------------------------------------------+
//|                                               CClosePosition.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property link      "https://www.mql5.com"
#property strict

#include "..\CBaseCommand.mqh"
#include <Expert\TradingExpert.mqh> 

extern CTradingExpert expert;

class CClosePosition : public CBaseCommand
{
public:
   virtual string Name() { return "CMD_CLOSE_POSITION"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
      if(!Validate("id", payload)) return false;
      // Action is implicitly CLOSE or explicitly CLOSE_PARTIAL
      
      // Delegate to Expert Logic (Synchronous)
      expert.ExecuteModification(*payload, responsePayload);
      
      string statusStr = responsePayload.HasKey("status") ? responsePayload["status"].ToStr() : "";
      if (statusStr == "ERROR" || statusStr == "REJECTED") {
          m_error = responsePayload.HasKey("message") ? responsePayload["message"].ToStr() : "Unknown Error";
          return false;
      }
      
      return true;
   }
};
