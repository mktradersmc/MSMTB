//+------------------------------------------------------------------+
//|                                                        Entry.mqh |
//|                                   Copyright 2023, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Mueller"
#property link      "https://www.mql5.com"
#property version   "1.03"
#property strict

#ifndef ENTRY_MQH
#define ENTRY_MQH

#include <Object.mqh>
#include <Expert\TradeInfo.mqh>


enum ENUM_ENTRY_TYPE
{
   ET_Limit_Market = 0, // Markt oder Bot managed Limit Order
   ET_Stop = 1, // Bot managed Stop Order
   ET_Explicit_Limit = 2, // Broker managed Limit Order
   ET_Explicit_Stop = 3 // Broker managed Stop Order
};

class CEntry : public CObject
{
public:
   double entryPrice;
   double stopLossPrice;
   double takeProfitPrice;
   double takeProfitTime;
   double riskRewardTarget;
   double riskPercentage;
   double takeProfitPartialsPrice;
   double takeProfitPartialsRR;
   double takeProfitPartialsPercentage;
   datetime timeScheduled;
   datetime timeOpened;
   ENUM_ENTRY_TYPE type;
   int direction;
   int invalidateAfterTimeSeconds;
   int beSLAfterTimeSeconds;
   double beSLAfterRiskReward;
   double beSLAtPrice;
   bool valid;
   ENUM_EVENT_TYPE closeEventType;
   CTradeInfo* trade;
   string strategyName;  
   double customRiskPercentage; 
   string m_symbol;
   
   CEntry();
   ~CEntry();
   
   bool IsLong();
   bool IsShort();
   CTradeInfo* GetTrade();
   bool IsTakeProfitByTime();
   string toString();
   bool IsValid();
   ENUM_EVENT_TYPE GetCloseEventType();  
   void SetCloseEventType(ENUM_EVENT_TYPE eventType);
};

CEntry::CEntry()
{
   entryPrice = 0;
   stopLossPrice = 0;
   takeProfitPrice = 0;
   takeProfitTime = 0;
   riskPercentage = 0;
   invalidateAfterTimeSeconds = 0;
   timeOpened = 0;
   riskRewardTarget = 0;
   beSLAfterTimeSeconds = 0;
   beSLAfterRiskReward = 0;
   beSLAtPrice = 0;
   takeProfitPartialsPrice = 0;
   takeProfitPartialsPercentage = 0;
   takeProfitPartialsRR = 0;
   customRiskPercentage = 0;
   direction = 0;
   valid = true;
   trade = NULL;
   type = ET_Limit_Market;
   strategyName = "";  
   closeEventType = EV_EMPTY;
   m_symbol = _Symbol;
}

CEntry::~CEntry()
{
   if(trade != NULL)
   {
      delete trade;
      trade = NULL;
   }
}

string CEntry::toString()
{
   string result = "\n--- Entry Details ---\n";
   result += "Strategy: " + strategyName + "\n";
   result += "Symbol: " + m_symbol + "\n"; // Added Symbol
   result += "Direction: " + (direction == 1 ? "LONG" : "SHORT") + "\n";
   
   string typeStr = "UNKNOWN";
   if(type == ET_Limit_Market) typeStr = "MARKET";
   else if(type == ET_Explicit_Limit) typeStr = "LIMIT";
   else if(type == ET_Explicit_Stop) typeStr = "STOP";
   else if(type == ET_Stop) typeStr = "STOP (Bot)";
   
   result += "Type: " + typeStr + "\n";
   result += "Entry Price: " + DoubleToString(entryPrice, _Digits) + "\n";
   result += "Stop Loss: " + DoubleToString(stopLossPrice, _Digits) + "\n";
   result += "Take Profit: " + DoubleToString(takeProfitPrice, _Digits) + "\n";
   result += "Risk Reward Target: " + DoubleToString(riskRewardTarget, 2) + "RR\n";
   result += "Risk Percentage: " + DoubleToString(riskPercentage, 2) + "%\n";
   
   if(customRiskPercentage > 0)
       result += "Custom Risk: " + DoubleToString(customRiskPercentage, 2) + "%\n";
       
   result += "---------------------";
   
   return result;
}

ENUM_EVENT_TYPE CEntry::GetCloseEventType() 
{ 
   return closeEventType; 
}

void CEntry::SetCloseEventType(ENUM_EVENT_TYPE eventType) 
{  
   closeEventType = eventType; 
}

bool CEntry::IsValid()
{
   return valid;
}

CTradeInfo* CEntry::GetTrade()
{
   return trade;
}

bool CEntry::IsTakeProfitByTime()
{
   return takeProfitTime > 0;
}

bool CEntry::IsLong()
{
   return direction == 1;
}

bool CEntry::IsShort()
{
   return direction == -1;
}

#endif
