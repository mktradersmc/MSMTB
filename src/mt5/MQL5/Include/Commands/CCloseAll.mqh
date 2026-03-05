//+------------------------------------------------------------------+
//|                                                    CCloseAll.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property link      "https://www.mql5.com"
#property strict

#include "..\CBaseCommand.mqh"
#include <Expert\TradingExpert.mqh> 

extern CTradingExpert expert;

class CCloseAll : public CBaseCommand
{
public:
   virtual string Name() { return "CMD_CLOSE_ALL"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
      // Optional Magic Filter
      string reason = "API Command CLOSE_ALL";
      expert.CloseAllPositions(reason);
      
      responsePayload["message"] = "Close All Signal Processed";
      return true;
   }
};
