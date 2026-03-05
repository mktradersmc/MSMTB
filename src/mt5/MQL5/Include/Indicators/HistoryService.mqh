//+------------------------------------------------------------------+
//|                                              HistoryService.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property strict

#include <JAson.mqh>
#include <Expert\WebSocketClient.mqh>

class CHistoryService
{
private:
   CWebSocketClient* m_wsClient;
   string            m_identitySymbol;
   string            m_botId;
   
public:
   CHistoryService() { m_wsClient = NULL; }
   
   void Init(CWebSocketClient* ws, string botId, string symbol)
   {
      m_wsClient = ws;
      m_botId = botId;
      m_identitySymbol = symbol;
   }
   
   bool HandleFetchHistory(CJAVal *payload, CJAVal &response) 
   {
       if (CheckPointer(payload) == POINTER_INVALID) return false;
       
       CJAVal *contentNode = payload;
       contentNode = (*payload)["payload"];
       
       string symbol = (*contentNode)["symbol"].ToStr();
       string tfStr = (*contentNode)["timeframe"].ToStr();
       
       long fromTime = 0;
       fromTime = (*contentNode)["from"].ToInt();
       
       int count = (int)(*contentNode)["count"].ToInt();
       if (count <= 0) count = 1000;
       if (count > 5000) count = 5000; // Hard Limit
       
       ENUM_TIMEFRAMES tf = StringToTimeframe(tfStr);
       
       MqlRates rates[];
       ArraySetAsSeries(rates, false); // 0=Oldest (Chronological)
       
       int copied = 0;
       
       // Logic: Fetch 'count' bars backwards from 'fromTime'
       // MQL5 `CopyRates(symbol, tf, start_time, count, rates)`:
       // "Gets count bars from the bar corresponding to start_time." -> goes backwards from start_time!
       
       if (fromTime > 0) {
           datetime start = (datetime)fromTime - 1;
           if (fromTime > 20000000000) start = (datetime)(fromTime / 1000) - 1; // MS correction
           
           copied = CopyRates(symbol, tf, start, count, rates);
       } else {
           copied = CopyRates(symbol, tf, 0, count, rates);
       }
       
       CJAVal data;
       
       if (copied > 0) {
           for(int i=0; i<copied; i++) {
               CJAVal bar;
               bar["time"] = (long)rates[i].time;
               bar["open"] = rates[i].open;
               bar["high"] = rates[i].high;
               bar["low"] = rates[i].low;
               bar["close"] = rates[i].close;
               bar["volume"] = (long)rates[i].tick_volume;
               data.Add(bar);
           }
       }
       
       response["symbol"] = symbol;
       response["timeframe"] = tfStr;
       response["count"] = (long)copied;
       response["data"].Set(data);
       response["status"] = "OK";
       
       Print("[HistoryService] Fetched ", copied, " bars for ", symbol, " ", tfStr);
       return true;
   }
   
   // SendHistoryBatch Removed
   
   ENUM_TIMEFRAMES StringToTimeframe(string tfStr)
   {
      if(tfStr == "M1") return PERIOD_M1;
      if(tfStr == "M2") return PERIOD_M2;
      if(tfStr == "M3") return PERIOD_M3;
      if(tfStr == "M4") return PERIOD_M4;
      if(tfStr == "M5") return PERIOD_M5;
      if(tfStr == "M6") return PERIOD_M6;
      if(tfStr == "M10") return PERIOD_M10;
      if(tfStr == "M12") return PERIOD_M12;
      if(tfStr == "M15") return PERIOD_M15;
      if(tfStr == "M20") return PERIOD_M20;
      if(tfStr == "M30") return PERIOD_M30;
      if(tfStr == "H1") return PERIOD_H1;
      if(tfStr == "H2") return PERIOD_H2;
      if(tfStr == "H3") return PERIOD_H3;
      if(tfStr == "H4") return PERIOD_H4;
      if(tfStr == "H6") return PERIOD_H6;
      if(tfStr == "H8") return PERIOD_H8;
      if(tfStr == "H12") return PERIOD_H12;
      if(tfStr == "D1") return PERIOD_D1;
      if(tfStr == "W1") return PERIOD_W1;
      if(tfStr == "MN1") return PERIOD_MN1;
      
      Print("[HistoryService] âš ï¸ Unknown timeframe string: '", tfStr, "'. Defaulting to PERIOD_CURRENT.");
      return PERIOD_CURRENT;
   }
};



