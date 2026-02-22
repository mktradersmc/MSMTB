//+------------------------------------------------------------------+
//|                                                      TickSpy.mq5 |
//|                                  Antigravity Agentic Integration |
//+------------------------------------------------------------------+
#property copyright "Antigravity Agentic Integration"
#property link      "https://antigravity.agent"
#property version   "13.6" 
#property indicator_chart_window
#property indicator_buffers 0
#property indicator_plots   0

#include <Expert\WebSocketClient.mqh>
#include <JAson.mqh>
#include <Expert\ConfigLoader.mqh>

#include <CCommandManager.mqh>
#include <Indicators\TickSpyService.mqh>

// Command Classes (Wrappers for Service)
class CCommandSubscribe : public CBaseCommand {
   CTickSpyService* s; public: CCommandSubscribe(CTickSpyService* _s){s=_s;}
   virtual string Name() { return "CMD_SUBSCRIBE_TICKS"; }
   virtual bool Execute(CJAVal *p, CJAVal &r) { s.ProcessSubscribeCommand(p, true); r["status"]="OK"; return true; }
};
class CCommandUnsubscribe : public CBaseCommand {
   CTickSpyService* s; public: CCommandUnsubscribe(CTickSpyService* _s){s=_s;}
   virtual string Name() { return "CMD_UNSUBSCRIBE_TICKS"; }
   virtual bool Execute(CJAVal *p, CJAVal &r) { s.ProcessSubscribeCommand(p, false); r["status"]="OK"; return true; }
};
class CCommandStartSynchronizedUpdate : public CBaseCommand {
   CTickSpyService* s; public: CCommandStartSynchronizedUpdate(CTickSpyService* _s){s=_s;}
   virtual string Name() { return "CMD_START_SYNCHRONIZED_UPDATE"; }
   virtual bool Execute(CJAVal *p, CJAVal &r) { 
       return s.ProcessStartSynchronizedUpdate(p, r); 
   }
};
class CCommandGetCurrentBar : public CBaseCommand {
   CTickSpyService* s; public: CCommandGetCurrentBar(CTickSpyService* _s){s=_s;}
   virtual string Name() { return "CMD_GET_CURRENT_BAR"; }
   virtual bool Execute(CJAVal *p, CJAVal &r) { 
       return s.ProcessGetCurrentBar(p, r); 
   }
};

// --- Inputs ---
input string InpInternalSymbol = ""; 
input string InpBotId = "AutoDetect"; 
#define WS_URL "ws://localhost:3000/mql5"

// --- Global State ---
CWebSocketClient g_WS;
CTickSpyService  g_Service;
CCommandManager  g_CmdManager;

string           g_IdentitySymbol = ""; 
string           g_BotId = "";
string           g_Url = WS_URL;
ulong            g_LastActivityTime = 0;
bool             g_TimerActive = false;
bool             g_TimerStartRequested = false;

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
   } else if (InpBotId != "" && InpBotId != "AutoDetect") {
       g_BotId = InpBotId; 
   } else {
       Print("[TickSpy] ❌ CRITICAL: No BotID found in bot_properties.txt and no Input provided! Aborting.");
       return(INIT_FAILED);
   }
   
   // Init Service
   // Register Commands
   g_CmdManager.Register("CMD_SUBSCRIBE_TICKS", new CCommandSubscribe(GetPointer(g_Service)));
   g_CmdManager.Register("CMD_UNSUBSCRIBE_TICKS", new CCommandUnsubscribe(GetPointer(g_Service)));
   // UNIFIED SYNC PROTOCOL
   g_CmdManager.Register("CMD_START_SYNCHRONIZED_UPDATE", new CCommandStartSynchronizedUpdate(GetPointer(g_Service)));
   g_CmdManager.Register("CMD_GET_CURRENT_BAR", new CCommandGetCurrentBar(GetPointer(g_Service)));
   
   g_WS.RegisterCommandHandler(GetPointer(g_CmdManager));
   g_Service.Init(GetPointer(g_WS), g_BotId, g_IdentitySymbol);
   
   Print("[TickSpy] 🟢 OnInit: ID=", g_BotId);
   
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   g_WS.Disconnect();
}

void OnTimer()
{
    // 1. Maintain WebSocket State (Register/Heartbeat/Timeout)
    g_WS.OnTimer();

    // 2. Process Incoming Messages if Connected
    if (g_WS.IsConnected()) {
        // STRICT ENFORCER: Client processes messages and Auto-Responds
        g_LastActivityTime = GetTickCount64(); // Keep alive
        g_WS.Process();
    } else {
        // Reconnect Logic (Throttled 5s)
        static ulong lastRetry = 0;
        if (GetTickCount64() - lastRetry > 5000) {
            Print("[TickSpy] 🔄 Reconnecting...");
            if (g_WS.Connect(WS_URL, g_BotId, "TICK_SPY", g_IdentitySymbol)) {
                Print("[TickSpy] ✅ Reconnected!");
            }
            lastRetry = GetTickCount64();
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
                g_Service.Init(GetPointer(g_WS), g_BotId, g_IdentitySymbol);
                Print("[TickSpy] 🔧 Received Start Event! BotId=", g_BotId, " InternalSym=", g_IdentitySymbol);
            }
        }

        g_TimerStartRequested = true;
        if (!g_TimerActive)
        {
            if (g_WS.Connect(WS_URL, g_BotId, "TICK_SPY", g_IdentitySymbol)) {
                Print("[TickSpy] WS Connected in OnChartEvent.");
            } else {
                Print("[TickSpy] ❌ OnChartEvent: Connect Failed. Will retry in OnTimer.");
            }

            g_TimerActive = EventSetMillisecondTimer(20); 
            if (g_TimerActive) {
                Print("[TickSpy] ✅ EVENT_START_TIMER received: Timer (20ms) started successfully!");
            } else {
                Print("[TickSpy] ❌ EVENT_START_TIMER received: Timer failed to start (Err=", GetLastError(), ")");
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
       OnTimer(); // Manually execute timer logic as fallback
   }

   g_Service.CheckNewBar();
   g_Service.StreamSubscribedData(); // Live Updates for Subscribed TFs (EV_BAR_UPDATE)
   return(rates_total);
}
