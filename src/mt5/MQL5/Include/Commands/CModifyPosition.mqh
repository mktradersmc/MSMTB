//+------------------------------------------------------------------+
//|                                              CModifyPosition.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property link      "https://www.mql5.com"
#property strict

#include "..\CBaseCommand.mqh"
#include <Expert\TradingExpert.mqh> 

extern CTradingExpert expert;

class CModifyPosition : public CBaseCommand
{
public:
   virtual string Name() { return "CMD_MODIFY_POSITION"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
      // ID (Magic) Check
      if(!Validate("id", payload)) return false;
      if(!Validate("action", payload)) return false;

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
