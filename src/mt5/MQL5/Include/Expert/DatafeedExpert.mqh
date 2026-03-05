//+------------------------------------------------------------------+
//|                                               DatafeedExpert.mqh |
//|                                  Copyright 2026, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//|                                                    Version 1.006 |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#include <Files/FileTxt.mqh>
#include "WebSocketClient.mqh"
#include "DatafeedServices.mqh"
#include "TimezoneUtils.mqh"
#include "ConfigLoader.mqh"
#include <JAson.mqh>
#include <CCommandManager.mqh>

#include <Commands\CGetSymbols.mqh>
#include <Commands\CConfigSymbols.mqh>
#include <Commands\CShutdownCommand.mqh>

class CDatafeedExpert
{
private:
   CWebSocketClient* m_wsClient;
// ...
   string m_url;
   ulong m_lastActivityTime; // WATCHDOG

public:
// ...
   CDatafeedExpert();
   ~CDatafeedExpert();
   
   bool OnInit();
   void OnDeinit();
   void OnTick();
   void OnTimer();
   void OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam);

private:
// void ProcessMessage(string msg);
   CDatafeedServices* m_services;
   CCommandManager    m_cmdManager;
   string m_botId;
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CDatafeedExpert::CDatafeedExpert()
{
   m_wsClient = new CWebSocketClient();
   m_services = new CDatafeedServices();
   m_services.SetWebSocketClient(m_wsClient); // INJECTION FIX
   m_botId = "";
   m_url = "ws://localhost:3000/mql5"; 
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CDatafeedExpert::~CDatafeedExpert()
{
   if(CheckPointer(m_services) == POINTER_DYNAMIC) delete m_services;
   if(CheckPointer(m_wsClient) == POINTER_DYNAMIC) delete m_wsClient;
}

// ...


//+------------------------------------------------------------------+
//| OnInit                                                           |
//+------------------------------------------------------------------+
bool CDatafeedExpert::OnInit()
{
    EventSetMillisecondTimer(100); // 100ms Timer for Datafeed
    
    // --- Config Loading ---
    BotConfig config;
    
    // 1. Load General Config (bot_properties.txt)
    if (CConfigLoader::LoadConfig("bot_properties.txt", config)) {
        if (config.botId != "") m_botId = config.botId;
        if (config.wsUrl != "") m_url = config.wsUrl;
        Print("[DatafeedExpert] 📄 Loaded bot_properties.txt. ID: ", m_botId);
    }

    // 2. Load Specific Config (DatafeedConfig.txt) - Overrides General
    if (CConfigLoader::LoadConfig("DatafeedConfig.txt", config)) {
        if (config.botId != "") m_botId = config.botId;
        if (config.wsUrl != "") m_url = config.wsUrl;
        Print("[DatafeedExpert] 📄 Loaded DatafeedConfig.txt. ID: ", m_botId);
    }
    
    // --- Fallback ID Generation ---
    if (m_botId == "") {
        m_botId = "Datafeed_" + (string)AccountInfoInteger(ACCOUNT_LOGIN);
        Print("[DatafeedExpert] ⚠️ No Config/ID found. Auto-Generated ID: ", m_botId);
    }

    Print("[DatafeedExpert] 🟢 OnInit Started. BotID: ", m_botId);

   if (m_wsClient.Connect(m_url, m_botId, "DATAFEED", "ALL")) {
       Print("[DatafeedExpert] ✅ WS Connected in OnInit.");
   } else {
       Print("[DatafeedExpert] ❌ WS Connect Failed in OnInit! Will retry in OnTimer...");
   }
   
   // Register Commands
   m_cmdManager.Register("CMD_GET_SYMBOLS", new CGetSymbols(m_services));
   m_cmdManager.Register("CMD_REQ_SYMBOLS", new CGetSymbols(m_services)); // Alias
   m_cmdManager.Register("CMD_CONFIG_SYMBOLS", new CConfigSymbols(m_services));
   m_cmdManager.Register("CMD_SHUTDOWN", new CShutdownCommand());
   
   // STRICT ENFORCER: Register Manager with Client
   m_wsClient.RegisterCommandHandler(GetPointer(m_cmdManager));
   
   return true;
}

// ...

//+------------------------------------------------------------------+
//| OnTimer                                                          |
//+------------------------------------------------------------------+
void CDatafeedExpert::OnTimer()
{
     if (!m_wsClient) return;

    // 1. WebSocket Maintenance (Heartbeat & Register)
    m_wsClient.OnTimer();

    // 2. Connection Handling & Message Processing
    if (m_wsClient.IsConnected()) 
    {
        // STRICT ENFORCER: Client processes messages and Auto-Responds
        m_wsClient.Process();
        
        // 3. Service Maintenance (if needed)
        m_services.OnTimer();
    }

    else 
    {
        // Reconnect Logic (Throttled 5s)
        static ulong lastRetry = 0;
        if (GetTickCount64() - lastRetry > 5000) {
            // Print("[DatafeedExpert] 🔄 Reconnecting...");
            if (m_wsClient.Connect(m_url, m_botId, "DATAFEED", "ALL")) {
                 Print("[DatafeedExpert] ✅ Reconnected!");
            }
            lastRetry = GetTickCount64();
        }
    }
}

// ProcessMessage removed (Handled by CWebSocketClient::Process)

//+------------------------------------------------------------------+
//| OnTick                                                           |
//+------------------------------------------------------------------+
void CDatafeedExpert::OnTick()
{
   // Datafeed is driven by Timer/WebSocket, not Ticks.
   // But we can check for services updates if needed.
}

// Methods removed: HandleFetchHistory, SendHistoryBatch (Legacy Pipe Logic)

//+------------------------------------------------------------------+
//| OnChartEvent                                                     |
//+------------------------------------------------------------------+
void CDatafeedExpert::OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
{
}

//+------------------------------------------------------------------+
//| OnDeinit                                                         |
//+------------------------------------------------------------------+
void CDatafeedExpert::OnDeinit()
{
   EventKillTimer();
   if (m_wsClient) m_wsClient.Disconnect();

   long chart_id = ChartID();
   string gvName = "AG_MASTER_" + IntegerToString(chart_id);
   GlobalVariableDel(gvName);
}
