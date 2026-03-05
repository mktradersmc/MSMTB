//+------------------------------------------------------------------+
//|                                             DatafeedServices.mqh |
//|                                  Copyright 2026, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef DATAFEED_SERVICES_MQH
#define DATAFEED_SERVICES_MQH

#include "DatafeedClient.mqh"
#include "UBCP_Structs.mqh"
#include <Arrays\ArrayString.mqh>
#include <Arrays\ArrayLong.mqh>
#include "TimezoneUtils.mqh"
#include "..\Services\SanityCheck.mqh" // Shared Service

//+------------------------------------------------------------------+
//|                                             DatafeedServices.mqh |
//|                                  Copyright 2026, MetaQuotes Ltd. |
//+------------------------------------------------------------------+
class CDatafeedServices 
{
private:
   // CDatafeedClient* m_tickClient; // DEPRECATED
   CWebSocketClient* m_wsClient;


public:
   CDatafeedServices();
   ~CDatafeedServices();
   
   void SetWebSocketClient(CWebSocketClient* client)
   {
      m_wsClient = client;
   }

   // DEPRECATED INTERFACE
   // void SetClients(CDatafeedClient* tickClient, CDatafeedClient* commandClient) {}

   // IDatafeedCommandHandler Implementation
   virtual void HandleCommand(string type, CJAVal &msg);

   void CloseAllSpyCharts(); // Task 0233: Clean Slate Startup (Public)
   
   // Push Protocol (v9.8)
   void OnTimer();

   CJAVal HandleConfigSymbolsCommand(CJAVal &msg); // Handshake
   CJAVal HandleGetSymbolsCommand(CJAVal &msg); // Synchronous RPC

private:
   void HandleBulkSyncCommand(CJAVal &msg);
   void HandleFetchHistoryCommand(CJAVal &msg);
   // End of Handlers
   
   ENUM_TIMEFRAMES StringToTimeframe(string tf);
   void EnsureSpyChart(string symbol, string internalSymbol, ENUM_TIMEFRAMES period);
   void EnsureHistoryChart(string symbol, string internalSymbol, ENUM_TIMEFRAMES period); // Added Declaration
   CJAVal EnsureAllConfiguredCharts(bool sendReport = false); // Guard Logic

   // Push Logic Helpers
   void CheckNewCandles(datetime currentTime);
   // void PushMissingHistory(string symbol, ENUM_TIMEFRAMES tf, datetime lastSent); // DEPRECATED
   void LoadState();
   void SaveState();
   
   long   m_timerCharts[];
   ulong  m_timerTimes[];
   string m_timerPayloads[];
   void   ScheduleTimerActivation(long chartId, string payload="");
   void   ProcessTimerActivations();
   
   // CJAVal m_pushState; // DEPRECATED
   CJAVal m_configuredList; // [Symbol, Symbol...]
   datetime m_lastTimerCheck;
};

CDatafeedServices::CDatafeedServices()
{
   m_wsClient = NULL;
   m_lastTimerCheck = 0;
   LoadState(); // Load persistence on startup
}

CDatafeedServices::~CDatafeedServices()
{
}

void CDatafeedServices::HandleCommand(string type, CJAVal &msg)
{
   Print("INCOMING RAW JSON: ", msg.Serialize());
   
   if (type == "CMD_GET_SYMBOLS") {
       Print("[Datafeed] 📥 Received CMD_GET_SYMBOLS");
       HandleGetSymbolsCommand(msg);
   }
   else if (type == "CMD_REQ_SYMBOLS") {
       Print("[Datafeed] 📥 Received CMD_REQ_SYMBOLS (Alias)");
       HandleGetSymbolsCommand(msg); 
   }

   else if (type == "CMD_FETCH_HISTORY") HandleFetchHistoryCommand(msg);
   else if (type == "CMD_BULK_SYNC") HandleBulkSyncCommand(msg);
   else if (type == "CMD_CONFIG_SYMBOLS") HandleConfigSymbolsCommand(msg);
   else if (type == "CMD_SANITY_CHECK") {
       Print("[Datafeed] Received CMD_SANITY_CHECK via WS. Executing...");
       // Use shared service
       CJAVal content = CSanityCheck::GetDiagnostics();
       // Add specific Datafeed stats

       
       CJAVal resp;
       resp["type"] = "SANITY_RESPONSE";
       resp["content"] = content;
       if (m_wsClient) m_wsClient.Send("SANITY_RESPONSE", resp.Serialize());
   }
}


/*
   Print("[Datafeed] Received CMD_UNSUBSCRIBE_TICKS");
   CJAVal *content = msg["content"]; 
   
   if (CheckPointer(content) != POINTER_INVALID)
// continued...
   {
       // Backend sends Single Object: { symbol, timeframe }
       string internalSym = "";
       string tf = "";
       
       if (content.HasKey("symbol") != NULL) internalSym = (*content)["symbol"].ToStr();
       if (content.HasKey("timeframe") != NULL) tf = (*content)["timeframe"].ToStr();
       
       // string brokerSym = m_commandClient.GetBrokerSymbol(internalSym); // FIX: Mapping service needed?
       // Quick Hack: Assume internal == broker for now or implement map
       string brokerSym = internalSym; 

       string subKey = brokerSym;
       if (tf != "") subKey += ":" + tf;
       
       Print("[Datafeed] Unsubscribing & Closing Chart: ", subKey);
       
       // 1. Remove from Subscription List
       int total = m_subscribedSymbols.Total();
       for(int i=total-1; i>=0; i--) {
           if (m_subscribedSymbols.At(i) == subKey) {
               m_subscribedSymbols.Delete(i);
               m_lastTickTimes.Delete(i);
               Print("[Datafeed] REMOVED Subscription: ", subKey);
           }
       }

       // 2. Find and CLOSE the Chart (Clean Up Resources)
       // This kills the TickSpy EA attached to it.
       if (tf != "") {
           ENUM_TIMEFRAMES period = StringToTimeframe(tf);
           
           // CRITICAL FIX: Do NOT close M1 charts. 
           // M1 charts host the 'HistoryWorker' (Infrastructure).
           // If we close M1, we kill the History Pipe.
           if (period == PERIOD_M1) {
               Print("[Datafeed] Preservation: Skipping ChartClose for M1 (HistoryWorker Host).");
               return; 
           }

           long chartID = ChartFirst();
           while(chartID >= 0) {
               long currID = chartID;
               chartID = ChartNext(chartID); // Advance iterator safe
               
               if (ChartSymbol(currID) == brokerSym && ChartPeriod(currID) == period) {
                    Print("[MT5] Closing Chart for ", brokerSym, " ", EnumToString(period), " (Unsubscribe)");
                    if (!ChartClose(currID)) {
                        Print("[MT5] Failed to Close Chart ", currID, " Err=", GetLastError());
                    } else {
                        Print("[MT5] Chart Closed Successfully.");
                    }
               }
           }
       }
   }
}

*/
//+------------------------------------------------------------------+
//| HandleGetSymbolsCommand                                          |
//+------------------------------------------------------------------+
//+------------------------------------------------------------------+
//| HandleGetSymbolsCommand                                          |
//+------------------------------------------------------------------+
CJAVal CDatafeedServices::HandleGetSymbolsCommand(CJAVal &msg)
{
   CJAVal response;
   // CLEAN RPC: No "type" wrapper. Just Data.
   
   int total = SymbolsTotal(false); 
   int limit = 2000;
   if (total > limit) total = limit;

   for(int i=0; i<total; i++)
   {
       string name = SymbolName(i, false); 
       string internal = name;
       string path = SymbolInfoString(name, SYMBOL_PATH);
       string desc = SymbolInfoString(name, SYMBOL_DESCRIPTION);
       long digits = SymbolInfoInteger(name, SYMBOL_DIGITS);
       
       CJAVal symObj;
       symObj["name"] = internal;
       symObj["path"] = path;
       symObj["desc"] = desc;
       symObj["digits"] = digits;
       
       // Use "symbols" key for clarity
       response["symbols"].Add(symObj);
   }
   
   Print("[Datafeed] 📤 Generated Symbol List. Count: ", total);
   return response;
}



//+------------------------------------------------------------------+
//| EnsureSpyChart (Single-Chart Model - Task 0125)                  |
//+------------------------------------------------------------------+
void CDatafeedServices::EnsureSpyChart(string symbol, string internalSymbol, ENUM_TIMEFRAMES ignoredPeriod)
{
   ENUM_TIMEFRAMES targetPeriod = PERIOD_M1;
   long chartID = ChartFirst();
   
   // 1. Scan for Existing Chart with TickSpy
   while(chartID >= 0) {
       long currID = chartID;
       chartID = ChartNext(chartID); 
       
       if(currID == ChartID()) continue; // Skip Master

       if (ChartSymbol(currID) == symbol) {
           // Check if TickSpy is attached
           int total = ChartIndicatorsTotal(currID, 0);
           bool foundInfo = false;
           for(int i=0; i<total; i++) {
               string name = ChartIndicatorName(currID, 0, i);
               if (StringFind(name, "TickSpy") >= 0) {
                   foundInfo = true;
                   break;
               }
           }
           if (foundInfo) {
               string currentBotId = "";
               if (m_wsClient != NULL) currentBotId = m_wsClient.GetBotId();
               ScheduleTimerActivation(currID, internalSymbol + "|" + currentBotId);
               return; // Found stable TickSpy chart
           }
       }
   }
   
   // 2. Open NEW Chart (PERIOD_M1) for TickSpy
   long newChart = ChartOpen(symbol, targetPeriod);
   if (newChart > 0) {
       Print("[MT5] Chart Opened for TickSpy (ID: ", newChart, " ", symbol, "). Attaching...");
       string currentBotId = "";
       if (m_wsClient != NULL) currentBotId = m_wsClient.GetBotId();
       AttachTickSpyManually(newChart, symbol, internalSymbol, targetPeriod, currentBotId);
       ScheduleTimerActivation(newChart, internalSymbol + "|" + currentBotId);
   } else {
       Print("[MT5] CRITICAL: Failed to execute ChartOpen for TickSpy ", symbol, " Err=", GetLastError());
   }
}

//+------------------------------------------------------------------+
//| EnsureHistoryChart (Triple-Bot: HistoryWorker)                   |
//+------------------------------------------------------------------+
void CDatafeedServices::EnsureHistoryChart(string symbol, string internalSymbol, ENUM_TIMEFRAMES ignoredPeriod)
{
   ENUM_TIMEFRAMES targetPeriod = PERIOD_M1;
   long chartID = ChartFirst();
   
   // 1. Scan for Existing Chart with HistoryWorker
   while(chartID >= 0) {
       long currID = chartID;
       chartID = ChartNext(chartID); 
       
       if(currID == ChartID()) continue; // Skip Master

       if (ChartSymbol(currID) == symbol) {
           // Check if HistoryWorker is attached
           int total = ChartIndicatorsTotal(currID, 0);
           bool foundInfo = false;
           for(int i=0; i<total; i++) {
               string name = ChartIndicatorName(currID, 0, i);
               if (StringFind(name, "HistoryWorker") >= 0) {
                   foundInfo = true;
                   break;
               }
           }
           if (foundInfo) {
               string currentBotId = "";
               if (m_wsClient != NULL) currentBotId = m_wsClient.GetBotId();
               ScheduleTimerActivation(currID, internalSymbol + "|" + currentBotId);
               return; // Found stable HistoryWorker chart
           }
       }
   }
   
   // 2. Open NEW Chart (PERIOD_M1) for HistoryWorker
   long newChart = ChartOpen(symbol, targetPeriod);
   if (newChart > 0) {
       Print("[MT5] Chart Opened for HistoryWorker (ID: ", newChart, " ", symbol, "). Attaching...");
       string currentBotId = "";
       if (m_wsClient != NULL) currentBotId = m_wsClient.GetBotId();
       
       // Clean BotID: Remove function suffix if present (e.g. "_DATAFEED") to get BASE ID
       // Actually, User wants Composite: "RoboForex_ID_DATAFEED_HISTORY_AUDUSD" ? 
       // User said: "HISTORY_AUDUSD_HISTORY_AUDUSD MUSS RoboForex_67177422_DATAFEED_HISTORY_AUDUSD heißen!"
       // So yes, pass the FULL currentBotId (which is "RoboForex_..._DATAFEED").
       
       AttachHistoryWorkerManually(newChart, symbol, internalSymbol, targetPeriod, currentBotId);
       ScheduleTimerActivation(newChart, internalSymbol + "|" + currentBotId);
   } else {
       Print("[MT5] CRITICAL: Failed to execute ChartOpen for HistoryWorker ", symbol, " Err=", GetLastError());
   }
}

//+------------------------------------------------------------------+
//| AttachTickSpyManually                                            |
//+------------------------------------------------------------------+
void AttachTickSpyManually(long chartID, string symbol, string internalSymbol, ENUM_TIMEFRAMES period, string botId)
{
    ResetLastError();
    if (ChartApplyTemplate(chartID, "TickSpy.tpl")) {
        Print("[MT5] SUCCESS: TickSpy template active on ", symbol);
    } else {
        Print("[MT5] CRITICAL: FAILED to apply TickSpy template (Err=", GetLastError(), ")");
        ChartClose(chartID); // Cleanup empty chart
    }
}

//+------------------------------------------------------------------+
//| AttachHistoryWorkerManually                                      |
//+------------------------------------------------------------------+
void AttachHistoryWorkerManually(long chartID, string symbol, string internalSymbol, ENUM_TIMEFRAMES period, string botId)
{
    ResetLastError();
    if (ChartApplyTemplate(chartID, "HistoryWorker.tpl")) {
        Print("[MT5] SUCCESS: HistoryWorker template active on ", symbol, " (Parent: ", botId, ")");
    } else {
        Print("[MT5] CRITICAL: FAILED to apply HistoryWorker template (Err=", GetLastError(), ")");
        ChartClose(chartID);
    }
}

void CDatafeedServices::HandleFetchHistoryCommand(CJAVal &msg)
{
   Print(">> [Datafeed:History] Command Received");
   
   // if (m_commandClient == NULL) { Print("[Datafeed:Error] CommandClient is NULL"); return; }

   CJAVal *content = msg.HasKey("content");
   if (CheckPointer(content) == POINTER_INVALID) { 
       // V7.0 Support: Handle Flat JSON (No 'content' wrapper)
       if (msg.HasKey("symbol") != NULL) {
           content = &msg;
       } else {
           Print("[Datafeed:Error] Content invalid (Missing 'content' wrapper and root 'symbol')"); 
           return; 
       }
   }
   
   string internalSymbol = (*content)["symbol"].ToStr();
   string tfStr = (*content)["timeframe"].ToStr();
   
   // --- Parse Parameters ---
   long fromTime = ((*content).HasKey("fromTime") != NULL) ? StringToInteger((*content)["fromTime"].ToStr()) : 0;
   long toTime = ((*content).HasKey("toTime") != NULL) ? StringToInteger((*content)["toTime"].ToStr()) : 0;
   long anchorTime = ((*content).HasKey("anchorTime") != NULL) ? StringToInteger((*content)["anchorTime"].ToStr()) : 0;
   
   // Backward compatibility: If anchor provided but no toTime, treat anchor as toTime for Deep logic?
   // Actually, SyncManager now standardized on toTime.
   
   int limit = ((*content).HasKey("count") != NULL) ? (int)StringToInteger((*content)["count"].ToStr()) : 1000;
   
   // string symbol = m_commandClient.GetBrokerSymbol(internalSymbol); // DEPRECATED
   string symbol = internalSymbol;
   if (!SymbolSelect(symbol, true)) { Print("[Datafeed:Error] SymbolSelect failed for ", symbol); return; }

   Print("[Datafeed:History] Request: ", internalSymbol, " -> BrokerSym: ", symbol, " | TF: ", tfStr, 
         " | From: ", (long)fromTime, " To: ", (long)toTime, " Anchor: ", (long)anchorTime, " Limit: ", limit);
   
   // --- Execution ---
   ENUM_TIMEFRAMES tf = StringToTimeframe(tfStr);
   MqlRates rates[];
   ArraySetAsSeries(rates, false); // Index 0 = Oldest
   
   int copied = 0;
   
   // --- Check Synchronization ---
   // v9.7: Added Retry Loop
   uint startWait = GetTickCount();
   bool synced = false;
   while(GetTickCount() - startWait < 3000) {
       if(SeriesInfoInteger(symbol, tf, SERIES_SYNCHRONIZED)) { synced = true; break; }
       double close = iClose(symbol, tf, 0); 
       Sleep(50);
   }

   if (!synced) Print("[Datafeed:Warning] ", symbol, " ", tfStr, " NOT synchronized.");

    // LOGIC:
    // 1. Explicit Range: fromTime > 0
    // 2. Deep/Anchor: anchorTime > 0 (and fromTime == 0)
    // 3. Latest: Both 0

    if (fromTime > 0) {
        // EXPLICIT RANGE (Forward or Specific Window)
        datetime start = (datetime)(fromTime / 1000);
        if (fromTime > 20000000000) start = (datetime)(fromTime / 1000); // Safety check for MS
        else start = (datetime)fromTime;
        
        datetime end = 0;
        if (toTime > 0) {
            end = (datetime)(toTime / 1000);
            if (toTime > 20000000000) end = (datetime)(toTime / 1000);
            else end = (datetime)toTime;
        } else {
            end = TimeCurrent();
        }
        
        Print("[Datafeed:History] Mode: RANGE. Start=", TimeToString(start), " End=", TimeToString(end));
        copied = CopyRates(symbol, tf, start, end, rates);
    } 
    else if (anchorTime > 0) {
        // DEEP SYNC (Backward from Anchor/To)
        // Note: New SyncManager sends 'toTime' for DEEP range too? 
        // No, DEEP tasks usually imply "Give me X bars BEFORE anchor".
        // But if SyncManager sends 'toTime' instead of 'anchorTime', we should check that.
        // Let's support 'anchorTime' as the End Point.
        
        datetime anchor = (datetime)anchorTime;
        if (anchorTime > 20000000000) anchor = (datetime)(anchorTime / 1000);
        
        // Try iBarShift
        int shift = iBarShift(symbol, tf, anchor, false);
        if (shift >= 0) {
             // Normal index-based fetch
             int startPos = shift + 1;
             Print("[Datafeed:History] Mode: DEEP (Index). Anchor=", TimeToString(anchor), " Shift=", shift, " Limit=", limit);
             copied = CopyRates(symbol, tf, startPos, limit, rates); // Fetches 'limit' bars STARTING at startPos (going backwards in time? No, CopyRates(pos, count) goes INTO history? 
             // CopyRates(pos, count) gets 'count' bars starting at 'pos' (where 0 is newest).
             // So CopyRates(0, 100) gets 0..99.
             // CopyRates(shift, limit) gets shift..shift+limit-1.
        } else {
             // Fallback: Time-based
             Print("[Datafeed:History] Mode: DEEP (Fallback). Anchor=", TimeToString(anchor), " not found. Using Time Range.");
             datetime fetchStart = anchor - (limit * PeriodSeconds(tf) * 20); // Wide search
             copied = CopyRates(symbol, tf, fetchStart, anchor, rates);
        }
    } 
    else {
        // LATEST
        Print("[Datafeed:History] Mode: LATEST. Limit=", limit);
        copied = CopyRates(symbol, tf, 0, limit, rates);
    }
   
   // --- Result Logging ---
   if (copied > 0) {
       Print("[Datafeed:History] Found ", copied, " bars. Range: ", 
             TimeToString(rates[0].time), " -> ", TimeToString(rates[copied-1].time));
   } else {
       int err = GetLastError();
       Print("[Datafeed:History] ⚠️ No data found (Copied=0). Error=", err);
   }

   // --- Response Building (UBCP) ---
   
   // Open Decentralized Pipe (AOS v11.0) - Routes to Worker -> Tags correctly with BotID
   // FIX Task 0158: Use INTERNAL SYMBOL for Pipe Name to match Worker expectation
   // RECOVERY: Route to Global History Pipe (MT5_Node_History) to bypass AOS_P lock
   string pipeName = "\\\\.\\pipe\\MT5_Node_History";
   int hPipe = FileOpen(pipeName, FILE_WRITE|FILE_BIN);
   
   if (hPipe != INVALID_HANDLE) {
       UBCPHeader header;
       header.magic = 0xAF;
       header.type = 2; // History
       
       // CLAMPING
       int sendingCount = copied;
       int startIdx = 0;
       
       if (copied > limit) {
           sendingCount = limit;
           startIdx = copied - limit;
       }
       
       header.count = (ushort)sendingCount;
       // FIX Task 0158: Headers are 16 bytes, not 8.
       StringToCharArray(internalSymbol, header.symbol, 0, 16);
       header.tf_sec = (uint)PeriodSeconds(tf);
       
       FileWriteStruct(hPipe, header);
       
       // Write Candles
       // We need an array of structs to use FileWriteArray efficiently
       // Or loop FileWriteStruct. Array is faster.
       UBCPCandle candles[];
       ArrayResize(candles, sendingCount);
       
       int cIdx = 0;
       for(int i=startIdx; i<copied; i++) {
           candles[cIdx].time = (long)rates[i].time;
           candles[cIdx].open = rates[i].open;
           candles[cIdx].high = rates[i].high;
           candles[cIdx].low = rates[i].low;
           candles[cIdx].close = rates[i].close;
           candles[cIdx].volume = (long)rates[i].tick_volume;
           cIdx++;
       }
       
       if (sendingCount > 0) {
           FileWriteArray(hPipe, candles);
           Print("<< [Datafeed:History] Sent UBCP Response for ", internalSymbol, " (Cnt: ", sendingCount, ")");
       } else {
           Print("<< [Datafeed:History] Sent Empty UBCP Header for ", internalSymbol);
       }
       
       FileFlush(hPipe);
       FileClose(hPipe);
   } else {
       Print("[Datafeed:Error] Failed to open History Pipe!");
   }
}

void CDatafeedServices::HandleBulkSyncCommand(CJAVal &msg)
{
   Print(">> [Datafeed:Bulk] Starting Bulk Sync...");
   
   CJAVal *content = msg["content"];
   CJAVal *items = (*content)["items"];
   
   if (CheckPointer(items) == POINTER_INVALID) return;
   
   // Response Map
   CJAVal response;
   CJAVal updatesArray;
   
   int totalUpdates = 0;
   int processedSymbols = 0;
   
   for(int i=0; i<items.Size(); i++) {
       CJAVal *item = items[i];
       string internalSymbol = (*item)["s"].ToStr();
       CJAVal *tfs = (*item)["tfs"];
       
       // string symbol = m_commandClient.GetBrokerSymbol(internalSymbol);
       string symbol = internalSymbol;
       if (!SymbolSelect(symbol, true)) continue;
       
       processedSymbols++;
       
       string knownTFs[] = {"M1","M2","M3","M5","M10","M15","M30","H1","H2","H4","H6","H8","H12","D1","W1","MN1"};
       
       for(int k=0; k<ArraySize(knownTFs); k++) {
           string tfKey = knownTFs[k];
           if ((*tfs).HasKey(tfKey) == NULL) continue;
           
           long lastTime = StringToInteger((*tfs)[tfKey].ToStr());
           
           ENUM_TIMEFRAMES tf = StringToTimeframe(tfKey);
           
           MqlRates rates[];
           int count = 0;
           
           // Logic Split: Initial vs Delta Sync
           if (lastTime == 0) {
               // INITIAL SYNC: Fetch latest 100 bars only (Count-based)
               // This prevents full history download from 1970
               count = CopyRates(symbol, tf, 0, 100, rates);
               // Print("[Datafeed:Bulk] Initial Sync for ", symbol, " ", tfKey, " (Count: ", count, ")");
           } 
           else {
               // DELTA SYNC: Fetch from last known time (Time-based)
               datetime start = (datetime)(lastTime / 1000);
               datetime end = TimeCurrent();
               count = CopyRates(symbol, tf, start + 1, end, rates);
               // Print("[Datafeed:Bulk] Delta Sync for ", symbol, " ", tfKey, " (Since: ", TimeToString(start), ")");
           }
           
           if (count > 0) {
               CJAVal updateBlock;
               updateBlock["symbol"] = internalSymbol;
               updateBlock["timeframe"] = tfKey;
               
               CJAVal candles;
               for(int r=0; r<count; r++) {
                   CJAVal c;
                   c["time"] = (long)rates[r].time;
                   c["open"] = (double)rates[r].open;
                   c["high"] = (double)rates[r].high;
                   c["low"] = (double)rates[r].low;
                   c["close"] = (double)rates[r].close;
                   c["volume"] = (long)rates[r].tick_volume;
                   candles.Add(c);
               }
               updateBlock["candles"].Set(candles);
               updatesArray.Add(updateBlock);
               totalUpdates++;
           }
       }
   }
   
   if (totalUpdates > 0) {
       Print("<< [Datafeed:Bulk] Sending ", totalUpdates, " updates for ", processedSymbols, " symbols.");
       response["updates"].Set(updatesArray);
       // m_commandClient.SendMessage("HISTORY_BULK_RESPONSE", response, "", false);
       if (m_wsClient != NULL) m_wsClient.Send("HISTORY_BULK_RESPONSE", response.Serialize());
       else Print("[Datafeed:Error] m_wsClient is NULL in BulkSync");
   } else {
       Print("<< [Datafeed:Bulk] No updates needed.");
   }
}
//+------------------------------------------------------------------+
//| StringToTimeframe                                                |
//+------------------------------------------------------------------+
ENUM_TIMEFRAMES CDatafeedServices::StringToTimeframe(string tf)
{
   if(tf == "M1") return PERIOD_M1;
   if(tf == "M2") return PERIOD_M2;
   if(tf == "M3") return PERIOD_M3;
   if(tf == "M5") return PERIOD_M5;
   if(tf == "M10") return PERIOD_M10;
   if(tf == "M15") return PERIOD_M15;
   if(tf == "M30") return PERIOD_M30;
   if(tf == "H1") return PERIOD_H1;
   if(tf == "H2") return PERIOD_H2;
   if(tf == "H3") return PERIOD_H3;
   if(tf == "H4") return PERIOD_H4;
   if(tf == "H6") return PERIOD_H6;
   if(tf == "H8") return PERIOD_H8;
   if(tf == "H12") return PERIOD_H12;
   if(tf == "D1") return PERIOD_D1;
   if(tf == "W1") return PERIOD_W1;
   if(tf == "MN1") return PERIOD_MN1;
    return PERIOD_CURRENT;
}

//+------------------------------------------------------------------+
//| HandleConfigSymbolsCommand (Handshake / Provisioning)            |
//+------------------------------------------------------------------+
CJAVal CDatafeedServices::HandleConfigSymbolsCommand(CJAVal &msg)
{
    Print("[Datafeed:Config] Received CMD_CONFIG_SYMBOLS via WS");
    
    CJAVal report;
    // report["type"] = "CONFIG_PROVISION_REPORT"; // REMOVED: Sync RPC handles type wrapping
    report["status"] = "ERROR";

    CJAVal* content = msg["content"];
    if (CheckPointer(content) == POINTER_INVALID) {
        Print("[Datafeed:Config] Error: Content missing.");
        report["message"] = "Content missing";
        return report;
    }
    
    CJAVal* symbolsArr = NULL;
    
    // Robustness: Handle both array directly or object wrapper
    if (CheckPointer(content) != POINTER_INVALID) {
          if ((*content).m_type == jtARRAY) { 
              symbolsArr = content;
              Print("[Datafeed:Config] Config is DIRECT ARRAY. Count: ", symbolsArr.Size());
          } else if ((*content).HasKey("symbols") != NULL) {
              symbolsArr = (*content)["symbols"];
          } else if ((*content).HasKey("items") != NULL) { 
              symbolsArr = (*content)["items"];
              Print("[Datafeed:Config] Config is ITEMS ARRAY. Count: ", symbolsArr.Size());
          }
    }
    
    if (CheckPointer(symbolsArr) != POINTER_INVALID) {
        // Store for persistence/restart
        m_configuredList.Clear();
        m_configuredList.Set(symbolsArr);
        SaveState(); 
        
        for(int i=0; i<symbolsArr.Size(); i++) {
             CJAVal* item = symbolsArr[i];
             string s = "";
             string internalS = "";
             
             if (item.m_type == jtSTR) {
                 s = item.ToStr();
                 internalS = s;
             } else {
                 if (item.HasKey("broker") != NULL) s = (*item)["broker"].ToStr();
                 if (item.HasKey("internal") != NULL) internalS = (*item)["internal"].ToStr();
                 else internalS = s;
             }
             
             Print("[Datafeed:Config] Provisioning: ", internalS);
             
             // 1. History Chart (M1)
             EnsureHistoryChart(s, internalS, PERIOD_M1);
             
             // 2. TickSpy Chart (M1)
             EnsureSpyChart(s, internalS, PERIOD_M1);
        }
        
        // Call EnsureAllConfiguredCharts and Capture Report
        report = EnsureAllConfiguredCharts(true); 
        report["status"] = "OK"; 
        
    } else {
        Print("[Datafeed:Config] Error: 'symbols' or 'items' array not found.");
        report["message"] = "Symbols array not found";
    }
    
    return report;
}

// Duplicate EnsureHistoryChart removed

//+------------------------------------------------------------------+
//| OnTimer (Called from Expert OnTimer)                             |
//+------------------------------------------------------------------+
void CDatafeedServices::OnTimer()
{
    static int timerCounter = 0;
    timerCounter++;
    
    if (timerCounter % 500 == 0) {
        EnsureAllConfiguredCharts();
    }
    
    ProcessTimerActivations();
}

void CDatafeedServices::ScheduleTimerActivation(long chartId, string payload)
{
    for (int i=0; i<ArraySize(m_timerCharts); i++) {
        if (m_timerCharts[i] == chartId) {
            m_timerPayloads[i] = payload; // Update payload in case it changed
            return; // Already tracking or sent
        }
    }
    int size = ArraySize(m_timerCharts);
    ArrayResize(m_timerCharts, size + 1);
    ArrayResize(m_timerTimes, size + 1);
    ArrayResize(m_timerPayloads, size + 1);
    m_timerCharts[size] = chartId;
    m_timerTimes[size] = GetTickCount64() + 5000;
    m_timerPayloads[size] = payload;
}

void CDatafeedServices::ProcessTimerActivations()
{
    if (ArraySize(m_timerCharts) == 0) return;
    ulong now = GetTickCount64();
    
    // Process and cleanup
    for (int i = ArraySize(m_timerCharts) - 1; i >= 0; i--)
    {
        long chartId = m_timerCharts[i];
        
        // 1. Cleanup closed charts
        if (ChartSymbol(chartId) == "") {
            int err = GetLastError(); // Clear error
            int lastIdx = ArraySize(m_timerCharts) - 1;
            if (i != lastIdx) {
                m_timerCharts[i] = m_timerCharts[lastIdx];
                m_timerTimes[i]  = m_timerTimes[lastIdx];
                m_timerPayloads[i] = m_timerPayloads[lastIdx];
            }
            ArrayResize(m_timerCharts, lastIdx);
            ArrayResize(m_timerTimes, lastIdx);
            ArrayResize(m_timerPayloads, lastIdx);
            continue;
        }
        
        // 2. Send event if time has come and not yet sent (target time > 0)
        if (m_timerTimes[i] > 0 && now >= m_timerTimes[i])
        {
            EventChartCustom(chartId, 101, 0, 0, m_timerPayloads[i]);
            Print(">> [DatafeedServices] ⏰ Sent EVENT_START_TIMER to Chart ", chartId, " Payload: ", m_timerPayloads[i]);
            
            m_timerTimes[i] = 0; // Mark as sent, keep in array to prevent re-scheduling
        }
    }
}

//+------------------------------------------------------------------+
//| EnsureAllConfiguredCharts                                        |
//+------------------------------------------------------------------+
CJAVal CDatafeedServices::EnsureAllConfiguredCharts(bool sendReport)
{
    CJAVal report;
    if (m_wsClient == NULL) return report;

    int total = m_configuredList.Size();

    CJAVal successArr;
    CJAVal failArr;
    
    int sCount = 0;
    int fCount = 0;
    
    // 1. OPEN MISSING / ENSURE CONFIGURED
    for(int i=0; i<total; i++)
    {
        string internalSym = "";
        string brokerSym = "";
        
        // Handle {internal, broker} object OR simple string
        CJAVal* item = m_configuredList[i];
        
        if (item.HasKey("broker") != NULL) {
             brokerSym = (*item)["broker"].ToStr();
             internalSym = (*item)["internal"].ToStr();
        } else {
             internalSym = item.ToStr();
             brokerSym = internalSym; 
        }
        
        if (brokerSym == "") continue;
        
        bool selected = SymbolSelect(brokerSym, true);
        if (!selected) {
             // Fallback Logic
             int err = GetLastError();
             if (internalSym != "" && internalSym != brokerSym && SymbolSelect(internalSym, true)) {
                 brokerSym = internalSym;
                 selected = true;
             }
        }
        
        if (!selected) {
             CJAVal fObj; fObj["broker"] = brokerSym; fObj["reason"] = "SymbolSelect Failed";
             failArr.Add(fObj); fCount++;
             Print("[Datafeed] ❌ SymbolSelect FAILED: ", brokerSym);
             continue;
        }
        
        EnsureSpyChart(brokerSym, internalSym, PERIOD_M1);
        EnsureHistoryChart(brokerSym, internalSym, PERIOD_M1);
        
        CJAVal sObj; sObj["broker"] = brokerSym; successArr.Add(sObj); sCount++;
    }
    
    // 2. CLOSE GHOSTS (Smart Cleanup)
    if (m_configuredList.Size() > 0) {
        long masterID = ChartID();
        long chartID = ChartFirst();
        CArrayLong ghosts;
        
        while(chartID >= 0) {
            if (chartID != masterID) {
               
               // Check if it is a Managed Chart (Has TickSpy or HistoryWorker)
               bool isManaged = false;
               int indTotal = ChartIndicatorsTotal(chartID, 0);
               for(int k=0; k<indTotal; k++) {
                   string name = ChartIndicatorName(chartID, 0, k);
                   if (StringFind(name, "TickSpy") >= 0 || StringFind(name, "HistoryWorker") >= 0) {
                       isManaged = true;
                       break;
                   }
               }
               
               if (isManaged) {
                   string chartSym = ChartSymbol(chartID);
                   bool isConfigured = false;
                   
                   for(int j=0; j<m_configuredList.Size(); j++) {
                       string cBroker = "";
                       string cInternal = "";
                       
                       CJAVal* item = m_configuredList[j];
                       if (item.HasKey("broker") != NULL) {
                            cBroker = (*item)["broker"].ToStr();
                            cInternal = (*item)["internal"].ToStr();
                       } else {
                            cInternal = item.ToStr();
                            cBroker = cInternal;
                       }
                       
                       if (chartSym == cBroker || chartSym == cInternal) {
                           isConfigured = true;
                           break;
                       }
                   }
                   
                   if (!isConfigured) {
                       ghosts.Add(chartID);
                   }
               }
            }
            chartID = ChartNext(chartID);
        }
        
        for(int g=0; g<ghosts.Total(); g++) {
            long gid = ghosts.At(g);
            Print("[Datafeed] 👻 Closing GHOST Chart: ", ChartSymbol(gid), " (ID: ", gid, ")");
            ChartClose(gid);
        }
    }
    
    if (sendReport) {
        // report["type"] = "CONFIG_PROVISION_REPORT"; // REMOVED: Managed by RPC
        
        CJAVal content;
        content["success_count"] = (long)sCount;
        content["fail_count"] = (long)fCount;
        content["success"].Set(successArr);
        content["failures"].Set(failArr);
        
        report["content"] = content;
        
        // m_wsClient.Send("CONFIG_PROVISION_REPORT", report.Serialize()); // REMOVED: Duplicate Send
    }
    
    Print("[Datafeed] 🏁 EnsureAllConfiguredCharts Finished for ", total, " items.");
    return report;
}


//+------------------------------------------------------------------+
//| CloseAllSpyCharts (Clean Slate Startup - Task 0233)              |
//+------------------------------------------------------------------+
void CDatafeedServices::CloseAllSpyCharts()
{
    Print("[Datafeed] 🧹 Starting CLEAN SLATE Protocol: Closing all sub-charts...");
    
    long masterID = ChartID();
    long chartID = ChartFirst();
    int closedCount = 0;
    
    // Collect IDs first to avoid iterator invalidation issues (though ChartNext is usually safe)
    // Actually, ChartFirst/Next is safe if we close *current*? 
    // Docs say: "ChartClose closes the specified chart. If it is the current chart..."
    // Iterating while modifying can be tricky.
    // Safe approach: Collect list, then close.
    
    CArrayLong chartsToClose;
    
    while(chartID >= 0) {
        if (chartID != masterID) {
            chartsToClose.Add(chartID);
        }
        chartID = ChartNext(chartID);
    }
    
    for(int i=0; i<chartsToClose.Total(); i++) {
        long id = chartsToClose.At(i);
        string sym = ChartSymbol(id);
        ENUM_TIMEFRAMES p = ChartPeriod(id);
        
        Print("[Datafeed] 🗑️ Closing Chart: ", sym, " ", EnumToString(p), " (ID: ", id, ")");
        if (ChartClose(id)) {
            closedCount++;
        } else {
            Print("[Datafeed] ⚠️ Failed to close ID: ", id, " Err=", GetLastError());
        }
    }
    
    Print("[Datafeed] 🧹 Clean Slate Complete. Closed ", closedCount, " charts. Waiting for Handshake.");
}

// PushMissingHistory REMOVED for Pure WS Architecture

//+------------------------------------------------------------------+
//| Persistence                                                      |
//+------------------------------------------------------------------+
void CDatafeedServices::LoadState()
{
// LoadState Deprecated
    Print("[Datafeed:Persistence] State Load Skipped (Pure WS).");
}

void CDatafeedServices::SaveState()
{
// SaveState Deprecated
    // No-op
}


#endif
