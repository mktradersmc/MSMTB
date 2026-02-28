//+------------------------------------------------------------------+
//|                                              CConfirmHistory.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property link      "https://www.mql5.com"
#property strict

#include "..\CBaseCommand.mqh"
#include <Expert\TradingExpert.mqh> 

extern CTradingExpert expert;

class CConfirmHistory : public CBaseCommand
{
public:
   virtual string Name() { return "CMD_CONFIRM_HISTORY"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
      // 1. Timestamp-based confirmation (Batch)
      long timestamp = 0;
      if(payload.HasKey("timestamp")) timestamp = (*payload)["timestamp"].ToInt();
      else if(payload.HasKey("maxTime")) timestamp = (*payload)["maxTime"].ToInt();
      
      if(timestamp > 0) {
          expert.ConfirmHistory(timestamp);
          responsePayload["message"] = "History Batch Confirmed";
          responsePayload["timestamp"] = timestamp;
          return true;
      }
      
      // 2. ID-based confirmation (Single)
      string tradeId = "";
      if(payload.HasKey("tradeId")) tradeId = (*payload)["tradeId"].ToStr();
      else if(payload.HasKey("id")) tradeId = (*payload)["id"].ToStr();
      
      if(tradeId == "") {
          return false;
      }
      
      expert.ConfirmHistory(tradeId);
      
      responsePayload["message"] = "History ID Confirmed";
      responsePayload["tradeId"] = tradeId;
      return true;
   }
};
