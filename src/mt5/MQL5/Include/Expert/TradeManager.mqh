//+------------------------------------------------------------------+
//|                                                 TradeManager.mqh |
//|                                   Copyright 2026, Michael M?ller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael M?ller"
#property strict

#include <Trade\Trade.mqh>
#include <AppClient.mqh> // For SendToPipe / Reports

class CTradeManager
{
private:
   CTrade            m_trade;
   CAppClient       *m_appClient;
   int               m_magic;
   int               m_retryCount;
   
   // Helper to generate consistent JSON responses
   void SendExecutionReport(string status, string message, string tradeId, ulong ticket)
   {
      if (m_appClient == NULL) return;
      
      CJAVal report;
      report["type"] = "EXECUTION_REPORT";
      report["tradeId"] = tradeId;
      report["status"] = status; // FILLED, REJECTED, PARTIAL_CLOSE
      report["message"] = message;
      report["ticket"] = (long)ticket;
      report["timestamp"] = (long)TimeCurrent();
      
      // Send directly (High priority)
      // Fix: Serialize CJAVal to string and use pointer access (MQL5 supports dot on pointers)
      m_appClient.SendToPipe(report.Serialize(), false);
   }

public:
   CTradeManager() : m_appClient(NULL), m_magic(0), m_retryCount(3) {}
   ~CTradeManager() {}

   void Init(CAppClient *client, int magic)
   {
      m_appClient = client;
      m_magic = magic;
      m_trade.SetExpertMagicNumber(magic);
      m_trade.SetMarginMode();
      m_trade.SetTypeFillingBySymbol(Symbol());
      m_trade.SetDeviationInPoints(10); 
   }

   // --- Core Execution ---
   bool ExecuteOrder(string symbol, ENUM_ORDER_TYPE type, double volume, double price, double sl, double tp, string comment, string tradeId)
   {
      // Reset State
      m_trade.SetTypeFillingBySymbol(symbol);
      
      // Retry Loop
      for(int i=0; i<m_retryCount; i++)
      {
         bool res = false;
         
         if (type == ORDER_TYPE_BUY || type == ORDER_TYPE_SELL) 
         {
             // Market Order
             res = m_trade.PositionOpen(symbol, type, volume, price, sl, tp, comment);
         }
         else 
         {
             // Pending Order (Limit/Stop)
             res = m_trade.OrderOpen(symbol, type, volume, 0.0, price, sl, tp, ORDER_TIME_GTC, 0, comment);
         }

         if (res)
         {
            ulong ticket = m_trade.ResultOrder();
            if (ticket == 0) ticket = m_trade.ResultDeal(); 
            
            Print("[TradeManager] SUCCESS: ", EnumToString(type), " Ticket=", ticket);
            SendExecutionReport("FILLED", "Order Executed Successfully", tradeId, ticket);
            return true;
         }
         else
         {
            int err = m_trade.ResultRetcode();
            Print("[TradeManager] RETRY ", (i+1), " Failed. Error: ", err, " Desc: ", m_trade.ResultRetcodeDescription());
            
            // Fast fail on fatal errors
            if (err == TRADE_RETCODE_INVALID_VOLUME || err == TRADE_RETCODE_NO_MONEY)
            {
               SendExecutionReport("REJECTED", m_trade.ResultRetcodeDescription(), tradeId, 0);
               return false;
            }
            
            Sleep(100); // Wait before retry
         }
      }

      // Final Fail
      SendExecutionReport("REJECTED", "Max Retries Exceeded", tradeId, 0);
      return false;
   }

   // --- Modification (SL/TP) ---
   bool ModifyPosition(ulong ticket, double sl, double tp, string tradeId)
   {
      if (m_trade.PositionModify(ticket, sl, tp))
      {
         SendExecutionReport("MODIFIED", "SL/TP Updated", tradeId, ticket);
         return true;
      }
      return false;
   }
   
   // --- Close / Partial ---
   bool ClosePartial(ulong ticket, double volume, string tradeId)
   {
      if (m_trade.PositionClose(ticket, volume))
      {
         SendExecutionReport("CLOSED_PARTIAL", "Position Partially Closed", tradeId, ticket);
         return true;
      }
      return false;
   }
   
   bool CloseFull(ulong ticket, string tradeId)
   {
      if (m_trade.PositionClose(ticket))
      {
         SendExecutionReport("CLOSED", "Position Closed", tradeId, ticket);
         return true;
      }
      return false;
   }
};
