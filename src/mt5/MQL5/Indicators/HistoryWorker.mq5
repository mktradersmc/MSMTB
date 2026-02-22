//+------------------------------------------------------------------+
//|                                                   HistoryWorker.mq5 |
//|                                  Antigravity Agentic Integration |
//+------------------------------------------------------------------+
#property copyright "Antigravity Agentic Integration"
#property link      "https://antigravity.agent"
#property version   "3.1" 
#property indicator_chart_window
#property indicator_buffers 0
#property indicator_plots   0

#include <Expert\WebSocketClient.mqh>
#include <JAson.mqh>
#include <Expert\ConfigLoader.mqh>
#include <CCommandManager.mqh>
#include <Indicators\HistoryService.mqh>
#include <Commands\CFetchHistory.mqh>

// --- Inputs ---
input string InpInternalSymbol = ""; 
input string InpBotId = "";          

// --- State Variables ---
CWebSocketClient *g_wsClient;
CHistoryService  g_Service;
CCommandManager  g_CmdManager;

string g_IdentitySymbol = "";
string g_BotId = "";
string g_Url = "ws://localhost:3000/mql5";
bool   g_TimerActive = false;
bool   g_TimerStartRequested = false;

//+------------------------------------------------------------------+
//| OnInit                                                           |
//+------------------------------------------------------------------+
int OnInit()
{
   g_IdentitySymbol = (InpInternalSymbol != "") ? InpInternalSymbol : _Symbol;
   
   // 1. Load Config
   BotConfig config;
   bool configLoaded = CConfigLoader::LoadConfig("bot_properties.txt", config);
   
   // 2. Determine ID (Priority: Config > Input > FAIL)
   if (configLoaded && config.botId != "") {
       g_BotId = config.botId;
       if (config.wsUrl != "") g_Url = config.wsUrl;
   } else if (InpBotId != "") {
       g_BotId = InpBotId;
   } else {
       Print("[HistoryWorker] ❌ CRITICAL: No BotID found in bot_properties.txt and no Input provided! Aborting.");
       return(INIT_FAILED);
   }
   
   Print("[HistoryWorker] Initializing for ", g_IdentitySymbol, " (ID: ", g_BotId, ")");
   
   g_wsClient = new CWebSocketClient();
   
   // Init Service
   g_Service.Init(g_wsClient, g_BotId, g_IdentitySymbol);
   
   // Register Command
   g_CmdManager.Register("CMD_FETCH_HISTORY", new CFetchHistory(&g_Service));
   
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   if(g_wsClient) delete g_wsClient;
}

void OnTimer()
{
    if (!g_wsClient) return;
    
    // 1. WebSocket Maintenance (Heartbeat & Register)
    g_wsClient.OnTimer();

    // 2. Connection Handling & Message Processing
    if (g_wsClient.IsConnected()) 
    {
        // Process WebSocket Messages
        string msg;
        int maxProcess = 50;
        while (maxProcess-- > 0 && g_wsClient.GetNextMessage(msg)) {
             CJAVal json;
             if (json.Deserialize(msg)) {
                  // Filter: Only Dispatch Commands
                  if (json.HasKey("header")) {
                      Print("[HistoryWorker] 📨 RX: ", StringSubstr(msg, 0, 200), (StringLen(msg) > 200 ? "..." : ""));
                      CJAVal result;
                      string cmd = "";
                      if(json["header"].HasKey("command")) cmd = json["header"]["command"].ToStr();
                      
                      string requestId = "";
                      if(json["header"].HasKey("request_id")) requestId = json["header"]["request_id"].ToStr();

                      // Strict Dispatch (bool return)
                      if (g_CmdManager.Dispatch(cmd, json, result)) {
                          string responseType = (cmd != "") ? cmd + "_RESPONSE" : "RESPONSE";
                          // result["type"] = responseType; // Removed: Type is in Header now
                          g_wsClient.SendProtocolMessage(responseType, result, requestId);
                      }
                  }
             }
        }
    }
    else 
    {
        // Reconnect Logic (Throttled 5s)
        static uint lastRetry = 0;
        if (GetTickCount() - lastRetry > 5000) {
            // Print("[HistoryWorker] 🔄 Reconnecting...");
            if (g_wsClient.Connect(g_Url, g_BotId, "HISTORY", g_IdentitySymbol)) {
                 Print("[HistoryWorker] ✅ Reconnected!");
            }
            lastRetry = GetTickCount();
        }
    }
}

void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
{
    if (id == CHARTEVENT_CUSTOM + 101)
    {
        if (sparam != "") {
            ushort sep = '|';
            string parts[];
            if (StringSplit(sparam, sep, parts) == 2) {
                g_IdentitySymbol = parts[0];
                g_BotId = parts[1];
                g_Service.Init(g_wsClient, g_BotId, g_IdentitySymbol);
                Print("[HistoryWorker] 🔧 Received Start Event! BotId=", g_BotId, " InternalSym=", g_IdentitySymbol);
            }
        }

        g_TimerStartRequested = true;
        if (!g_TimerActive)
        {
            if (g_wsClient.Connect(g_Url, g_BotId, "HISTORY", g_IdentitySymbol)) {
                Print("[HistoryWorker] WS Connected in OnChartEvent.");
            } else {
                Print("[HistoryWorker] ⚠️ WS Connect Failed! Will retry in OnTimer...");
            }

            g_TimerActive = EventSetMillisecondTimer(100); 
            if (g_TimerActive) {
                Print("[HistoryWorker] ✅ EVENT_START_TIMER received: Timer (100ms) started successfully!");
            } else {
                Print("[HistoryWorker] ❌ EVENT_START_TIMER received: Timer failed to start (Err=", GetLastError(), ")");
            }
        }
    }
}

int OnCalculate(const int rates_total,
                const int prev_calculated,
                const datetime &time[],
                const double &open[],
                const double &high[],
                const double &low[],
                const double &close[],
                const long &tick_volume[],
                const long &volume[],
                const int &spread[])
{
   if (g_TimerStartRequested && !g_TimerActive) {
       OnTimer(); // Manually execute timer logic
   }
   return(rates_total);
}
