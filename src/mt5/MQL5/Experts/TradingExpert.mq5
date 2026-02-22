//+------------------------------------------------------------------+
//|                                                TradingExpert.mq5 |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property link      "https://www.mql5.com"
#property version   "3.10"

// Include Core Logic
#include <Expert\TradingExpert.mqh>
#include <Commands\CTradeExecute.mqh>
#include <Commands\CModifyPosition.mqh>
#include <Commands\CClosePosition.mqh>
#include <Commands\CAckTrade.mqh>
#include <Commands\CConfirmHistory.mqh>

input string InpBotID = ""; // Optional: Override BotID

// Global Instance
CTradingExpert expert;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   // Register Commands
   expert.RegisterCommand("CMD_EXECUTE_TRADE", new CTradeExecute());
   expert.RegisterCommand("CMD_MODIFY_POSITION", new CModifyPosition());
   expert.RegisterCommand("CMD_CLOSE_POSITION", new CClosePosition());
   expert.RegisterCommand("CMD_ACK_TRADE", new CAckTrade(&expert)); // Pass expert pointer (it has HandleAckTrade)
   expert.RegisterCommand("CMD_CONFIRM_HISTORY", new CConfirmHistory());

   if(InpBotID != "") expert.SetBotID(InpBotID);
   expert.OnInit();
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   expert.OnDeinit(reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   expert.OnTick();
}

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
{
   expert.OnTimer();
}

//+------------------------------------------------------------------+
//| Chart Event function                                             |
//+------------------------------------------------------------------+
void OnChartEvent(const int id,
                  const long &lparam,
                  const double &dparam,
                  const string &sparam)
{
    expert.OnChartEvent(id, lparam, dparam, sparam);
}

//+------------------------------------------------------------------+
//| Trade Transaction function                                       |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans,
                        const MqlTradeRequest& request,
                        const MqlTradeResult& result)
{
    expert.OnTradeTransaction(trans, request, result);
}
