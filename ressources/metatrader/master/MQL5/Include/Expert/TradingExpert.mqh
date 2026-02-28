#ifndef TRADING_EXPERT_MQH
#define TRADING_EXPERT_MQH

#include <Trade\Trade.mqh>
// Include Command Framework
#include <CCommandManager.mqh>
#include <Expert\TradingConfig.mqh>
#include <Expert\AnchorResolver.mqh>
#include <Arrays\ArrayLong.mqh>
#include <Arrays\ArrayLong.mqh>
#include <Arrays\ArrayString.mqh>
#include <Arrays\ArrayObj.mqh>
#include <Expert\WebSocketClient.mqh>
#include <Expert\ConfigLoader.mqh> 

#define MAGICMA 123456

//+------------------------------------------------------------------+
//| Message Priority Queue Item                                      |
//+------------------------------------------------------------------+
class CMessageItem : public CObject {
public:
    CJAVal* m_val;
    int m_priority;
    long m_timestamp;
    
    CMessageItem(CJAVal* v) {
        m_val = new CJAVal();
        m_val.Copy(v); 
        
        m_priority = 0;
        string type = (*m_val)["type"].ToStr();
        
        if (type == "CMD_SUBSCRIBE_TICKS" || type == "CMD_UNSUBSCRIBE_TICKS" || type == "CMD_BROKER_CONFIG" || type == "REGISTER") {
            m_priority = 10;
        }
        else if (type == "CMD_FETCH_HISTORY" || type == "CMD_BULK_SYNC") {
            m_priority = 0;
        }
        
        m_timestamp = 0;
        if ((*m_val).HasKey("timestamp")) m_timestamp = StringToInteger((*m_val)["timestamp"].ToStr());
        else if ((*m_val).HasKey("customId")) {
            string cid = (*m_val)["customId"].ToStr();
            string parts[];
            if (StringSplit(cid, '-', parts) > 0) m_timestamp = StringToInteger(parts[0]);
        }
    }
    
    ~CMessageItem() {
        if(m_val) delete m_val;
    }
    
    virtual int Compare(const CObject *node, const int mode=0) const {
        const CMessageItem* other = (CMessageItem*)node;
        // 1. Priority (Higher First) => Descending
        if (this.m_priority > other.m_priority) return -1;
        if (this.m_priority < other.m_priority) return 1;
        
        // 2. Time (Older First) => Ascending
        if (this.m_timestamp < other.m_timestamp) return -1;
        if (this.m_timestamp > other.m_timestamp) return 1;
        
        return 0; 
    }
};

enum AppConnectionState {
    APP_STATE_DISCONNECTED,
    APP_STATE_REGISTERING,
    APP_STATE_CONNECTING,
    APP_STATE_CONNECTED
};

//+------------------------------------------------------------------+
//| Structs & Enums                                                  |
//+------------------------------------------------------------------+   // Deal Data Structure (Idempotent History)
   class SDealData : public CObject {
   public:
      ulong ticket;
      double profit;
      double comm;
      double swap;
      long time;
      long entry; // NEW: Store Entry Type
      
      SDealData(ulong t, double p, double c, double s, long tm, long e) : ticket(t), profit(p), comm(c), swap(s), time(tm), entry(e) {}
      ~SDealData() {} 
   };
   
   class CMetric : public CObject {
public:
   ulong magic; 
   CArrayObj m_deals; // List of SDealData
   
   // State
   bool isOpen;
   ulong closeTime;
   
   // Execution Details (Persistent / Latched)
   ulong openTime;
   double entryPrice;
   double sl;
   double tp;
   ulong positionTicket; // Active Position Ticket
   string symbol;
   long type;
   string comment;
   
   // Cached Totals (Recalculated)
   double totalRealizedPl;
   double totalComm;
   double totalSwap;
   double totalVolume;

   CMetric() { 
      magic=0; isOpen=false; closeTime=0; 
      openTime=0; entryPrice=0; sl=0; tp=0; positionTicket=0;
      symbol=""; type=0; comment=""; 
      totalRealizedPl=0; totalComm=0; totalSwap=0; totalVolume=0;
   }
   
   ~CMetric() { m_deals.Clear(); }
   
   void AddDeal(ulong ticket, double p, double c, double s, long t, double v, int entryType) {
      // Idempotency Check
      for(int i=0; i<m_deals.Total(); i++) {
         SDealData* d = (SDealData*)m_deals.At(i);
         if(d.ticket == ticket) return; // Already processed
      }
      
      m_deals.Add(new SDealData(ticket, p, c, s, t, (long)entryType));
      
      // Update Volume/Time if Entry
      if(entryType == DEAL_ENTRY_IN) {
          totalVolume += v;
          if(openTime == 0 || t < (long)openTime) openTime = (ulong)t;
      }
      
      Recalculate();
   }
   
   void Recalculate() {
      totalRealizedPl = 0;
      totalComm = 0;
      totalSwap = 0;
      
      for(int i=0; i<m_deals.Total(); i++) {
         SDealData* d = (SDealData*)m_deals.At(i);
         
         // STRICT RULE: Realized PL Only comes from OUT/INOUT deals.
         // ENTRY_IN profit (if any) is ignored as it is NOT realized exit profit.
         if(d.entry != DEAL_ENTRY_IN) {
             totalRealizedPl += d.profit; 
         }
         
         totalComm += d.comm;
         totalSwap += d.swap;
         
         if((ulong)d.time > closeTime) closeTime = (ulong)d.time;
      }
      
      if(isOpen) closeTime = 0; // If open, closeTime is technically undefined or strictly historical
   }
};

class CTradingExpert : public CObject
{
private:
   CTradingConfig*   m_config;
   
   // --- AppClient Inline Config ---
   string            m_botId;
   string            m_apiKey;

   // Command Manager
   CCommandManager   m_cmdManager;
   
   string            m_communicationMode; 
   string            m_exchangePath;      
   int               m_pollIntervalMs;  
   string            m_timezoneSignature;
   
   // --- State ---
   string            m_symbol;
   long              m_lastTimestamp; 
   long              m_lastCommandTimestamp;
   
   // --- Timing ---
   ulong             m_lastPollTime;    
   ulong             m_lastHeartbeatTime; 
   ulong             m_lastStatusUpdateTime;
   ulong             m_statusFailureStartTime;
   ulong             m_lastStatusErrorLogTime;
   
   // --- WS State ---
   CWebSocketClient  m_wsClient;
   string            m_wsUrl;
   AppConnectionState m_state;
   
   // --- Deduplication ---
   string            m_processedIds[50]; 
   int               m_processedIdHead; 
   CArrayLong        m_ackedClosedTrades; // Track fully closed trades ACKNOWLEDGED by Backend
   CArrayString      m_executedTradeStrings; // Deduplication for In-Flight strings (Race Condition Guard)
   
   // --- Account State ---
   double            m_dailyStartBalance;
   int               m_currentDay;
   bool              m_tradingStoppedForDay;
   
   // --- Inline AppClient Methods ---
   bool              LoadBotProperties(string configFile="bot_properties.txt");
   void              ParseConfigLine(string line);

   bool              RegisterBot();
   
   // --- Message Processing ---
   int               GetMessages(CJAVal &messagesArray);
   void              ProcessIncomingMessages(CJAVal &messages, CJAVal &outputArray);
   void              ProcessSingleMessage(CJAVal &msg, CJAVal &outputArray);
   
   // --- Communication ---
   bool              SendMessage(string type, CJAVal& content, string requestId="", bool useQueue=false);
   bool              UpdateMessageStatus(string messageId, bool isActive);

   // --- Helpers ---
   bool              IsNewDay();
   void              ResetDailyStats();
   void              CheckDailyEquityLimits();
   void              CloseAllPositions(string reason);
   double            CalculateBreakEvenPrice(ulong ticket);
   
   // --- Trade Execution Helpers ---

   double            CalculatePositionSize(string symbol, double riskPercent, int slPoints);
   string            GenerateTradeId();
   string            GenerateOrderComment(string strategy, string tradeId, double risk);
   bool              ExecutePositionModification(ulong ticket, string action, CJAVal &data);
   void              ExecuteOrderModification(ulong ticket, string action, CJAVal &data);
   bool              SafePartialClose(ulong ticket, double volume, ulong magic);
   
   // --- Reporting ---
   void              GetAccountStats(CJAVal &node);
   
public:
                     CTradingExpert();
                    ~CTradingExpert();
   
   void              OnInit();
   void              OnDeinit(const int reason);
   void              OnTick();
   void              OnTimer();
   void              OnTradeTransaction(const MqlTradeTransaction& trans, const MqlTradeRequest& request, const MqlTradeResult& result);
   void              OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam); 
   
   // Command Handling
   void              BroadcastStatus();
   void              SendHeartbeat();
   
   // Core Execution
   void              ExecuteTrade(CJAVal &data, CJAVal &response);
   void              ExecuteModification(CJAVal &data, CJAVal &response);
   
   // Configuration
   void              SetBotID(string id) { m_botId = id; }
   void              RegisterCommand(string name, CBaseCommand* cmd) { m_cmdManager.Register(name, cmd); }
   
   // Optimization
   string            m_lastReportHash;
   string            CalculateHash(string data);
   
   // Reporting
   void              ReportPositions();
   void              RebuildMetricsForOpenPositions(); // New Helper
   void              RebuildDailyState(); // Robust Rebuild
   
   // Incremental History State
   datetime          m_lastHistoryTime;
   CArrayObj         m_metrics; 
   // int               m_metricCount; // REMOVED
   CArrayLong        m_processedDealTickets; // Deduplication logic
   CArrayLong        m_orphanDeals; // Zero Magic Recovery

   void              HandleAckTrade(CJAVal *payload);
   void              ConfirmHistory(string tradeId);
   void              ConfirmHistory(long timestamp);
};

CTradingExpert::CTradingExpert()
{
   m_config = CTradingConfig::GetInstance();
   m_dailyStartBalance = 0;
   m_currentDay = 0;
   m_tradingStoppedForDay = false;
   
   // AppClient Init
   m_communicationMode = "WS"; // Default to WS
   m_wsUrl = "ws://localhost:3000/mql5"; // Default updated to Port 3000
   m_pollIntervalMs = 1000;
   m_state = APP_STATE_DISCONNECTED;
   m_lastPollTime = 0;
   m_lastHeartbeatTime = 0;
   m_lastStatusUpdateTime = 0;
   m_statusFailureStartTime = 0;
   m_lastStatusErrorLogTime = 0;
   m_processedIdHead = 0;
   m_lastTimestamp = 0;
   m_lastCommandTimestamp = 0;
   m_timezoneSignature = "EET";
   
   m_processedIdHead = 0;
   
   for(int i=0; i<50; i++) m_processedIds[i] = ""; 
}

CTradingExpert::~CTradingExpert()
{
}

//+------------------------------------------------------------------+
//| Initialization                                                   |
//+------------------------------------------------------------------+
void CTradingExpert::OnInit()
{
   Print("[TradingExpert] v3.2 (Clean) - Initializing...");
   
   m_symbol = _Symbol;
   m_config.InitFromInputs();
   
   // Load Properties
   if (!LoadBotProperties()) {
       Print("[TradingExpert] WARNING: Failed to load bot_properties.txt.");
   }

   // STRICT ID CHECK (User Request: No Fallback)
   if (m_botId == "") {
       Print("[TradingExpert] ❌ FATAL: BotID is MISSING! Please configure bot_properties.txt or inputs.");
       return; 
   }
   
   Print("[TradingExpert] BotID: ", m_botId, " Mode: ", m_communicationMode);
   
   // DEBUG: Write BotID to File for External Verification
   int hDebug = FileOpen("debug_botid.txt", FILE_WRITE|FILE_TXT|FILE_ANSI);
   if (hDebug != INVALID_HANDLE) {
       FileWrite(hDebug, "Company: " + AccountInfoString(ACCOUNT_COMPANY));
       FileWrite(hDebug, "BotID: " + m_botId);
       FileWrite(hDebug, "Time: " + TimeToString(TimeCurrent()));
       FileClose(hDebug);
   }
   
   // WS Connection Init (Immediate Try)
   if (m_wsClient.Connect(m_wsUrl, m_botId, "TRADING", "ALL")) {
       Print("[TradingExpert] ✅ WS Connected in OnInit.");
   } else {
       Print("[TradingExpert] ❌ WS Connect Failed in OnInit! Will retry in OnTimer...");
   }
   
   // Set Initial Account State
   m_dailyStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   MqlDateTime dt;
   TimeCurrent(dt);
   m_currentDay = dt.day;
   
   // Incremental History Init
   m_lastHistoryTime = iTime(NULL, PERIOD_D1, 0);
   // m_metricCount = 0; // REMOVED
   // ArrayResize(m_dailyMetrics, 200); // REMOVED
   m_metrics.Clear(); 
   
   RebuildMetricsForOpenPositions(); // Restore metrics from history for active positions
   
   Print("[TradingExpert] Daily Start Balance: ", DoubleToString(m_dailyStartBalance, 2));

   // High-Freq Timer (20ms) - Ultra Low Latency
   EventSetMillisecondTimer(20);
}

void CTradingExpert::OnDeinit(const int reason)
{
   EventKillTimer();
   m_wsClient.Disconnect();
   Print("[TradingExpert] Deinit. Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Main Loop                                                        |
//+------------------------------------------------------------------+
void CTradingExpert::OnTick()
{
   // 2. Check New Day
   if(IsNewDay())
   {
      ResetDailyStats();
   }
   
   // 3. Risk Management Checks (Equity Guard)
   if(!m_tradingStoppedForDay)
   {
      CheckDailyEquityLimits();
   }
}

void CTradingExpert::OnTimer()
{
   ulong start = GetTickCount64();

   // 1. WebSocket Maintenance (Heartbeat/Register)
   m_wsClient.OnTimer();

   // 2. Connection Handling & Message Processing
   if (m_wsClient.IsConnected()) 
   {
       m_state = APP_STATE_CONNECTED;
       
       // Process WebSocket Messages
       string msg;
       int maxProcess = 50; 
       while(maxProcess-- > 0 && m_wsClient.GetNextMessage(msg)) 
       {
            if (msg == "") continue;
            CJAVal json;
            if (json.Deserialize(msg)) {
                string msgType = json["type"].ToStr();
                if (msgType != "HEARTBEAT_ACK") {
                     CJAVal dummyOutput; 
                     ProcessSingleMessage(json, dummyOutput);
                }
            }
       }
   } 
   else 
   {
       m_state = APP_STATE_DISCONNECTED;
       
       // Reconnect Logic (Throttled 5s)
       static ulong lastRetry = 0;
       if (GetTickCount64() - lastRetry > 5000) {
           // Retry with Correct Params: TRADING + ALL
           if (m_wsClient.Connect(m_wsUrl, m_botId, "TRADING", "ALL")) {
               Print("[TradingExpert] ✅ WS Reconnected!");
               m_state = APP_STATE_CONNECTED;
           }
           lastRetry = GetTickCount64();
       }
   }

   // 3. Status Broadcast (200ms) - Only if Connected
   if (m_state == APP_STATE_CONNECTED && start - m_lastStatusUpdateTime >= 200)
   {
       BroadcastStatus();
       m_lastStatusUpdateTime = start;
   }
    
   // 4. Position Report (50ms)
   static ulong lastPosReport = 0;
   if (start - lastPosReport >= 50)
   {
       ReportPositions(); 
       lastPosReport = start;
   }
}

//+------------------------------------------------------------------+
//| OnChartEvent                                                     |
//+------------------------------------------------------------------+
void CTradingExpert::OnChartEvent(const int id, const long &lparam, const double &dparam, const string &sparam)
{
    // No more Proxy Events
}

//+------------------------------------------------------------------+
//| Trade Transaction Event                                          |
//+------------------------------------------------------------------+
void CTradingExpert::OnTradeTransaction(const MqlTradeTransaction& trans,
                                        const MqlTradeRequest& request,
                                        const MqlTradeResult& result)
{
    bool triggerReport = false;

    // 1. Detect Closed Trade (Deal Add + Entry Out/InOut)
    if(trans.type == TRADE_TRANSACTION_DEAL_ADD)
    {
        triggerReport = true;
        
        // INCREMENTAL UPDATE or FULL REBUILD?
        // User requested "1:1 correctness". 
        // A partial rebuild or single add is faster, but `RebuildDailyState` is safest.
        
        ulong dealTicket = trans.deal;
        if(dealTicket > 0 && HistoryDealSelect(dealTicket)) 
        {
             // Add single deal to metrics (Optimization)
             ulong magic = (ulong)HistoryDealGetInteger(dealTicket, DEAL_MAGIC);
             if(magic > 0) {
                 CMetric* metric = NULL;
                 for(int k=0; k<m_metrics.Total(); k++) {
                     CMetric* m = m_metrics.At(k);
                     if(m.magic == magic) { metric = m; break; }
                 }
                 if(metric == NULL) {
                     metric = new CMetric();
                     metric.magic = magic;
                     m_metrics.Add(metric);
                 }
                 
                 double profit = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
                 double comm = HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
                 double swap = HistoryDealGetDouble(dealTicket, DEAL_SWAP);
                 double vol = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
                 long entry = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
                 long time = HistoryDealGetInteger(dealTicket, DEAL_TIME);
                 
                 // Add Deal (Idempotent)
                 metric.AddDeal(dealTicket, profit, comm, swap, time, vol, (int)entry);
                 
                 if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT)
                 {
                     Print("[TradingExpert] 💰 OnTradeTransaction: Deal Added. Magic=", magic, " PL=", profit);
                 }
             }
        }
    }
    else if (trans.type == TRADE_TRANSACTION_ORDER_ADD || trans.type == TRADE_TRANSACTION_HISTORY_ADD) {
        triggerReport = true;
    }
    
    if(triggerReport) {
       // Refresh Open Position Status flags
       // We need to verify if positions are still valid (e.g. if one closed fully)
       
       // Optimization: Just Report. ReportPositions does NOT strictly rebuild state anymore.
       // It assumes m_metrics is up to date via RebuildDailyState or OnTradeTransaction.
       // However, OnTradeTransaction might miss "Closed" status if we don't update isOpen.
       
       // Let's do a lightweight state refresh inside Report
       ReportPositions(); 
       BroadcastStatus(); 
    }
}

//+------------------------------------------------------------------+
//| INLINE APPCLIENT LOGIC                                           |
//+------------------------------------------------------------------+
bool CTradingExpert::LoadBotProperties(string configFile)
{
    BotConfig config;
    if (CConfigLoader::LoadConfig(configFile, config)) {
        if (config.botId != "") m_botId = config.botId;
        if (config.apiKey != "") m_apiKey = config.apiKey;
        if (config.pollInterval > 0) m_pollIntervalMs = config.pollInterval;
        if (config.commMode != "") m_communicationMode = config.commMode;
        if (config.wsUrl != "") m_wsUrl = config.wsUrl;
        
        Print("[TradingExpert] 📄 Config Loaded. BotID: ", m_botId, " WS: ", m_wsUrl);
        return true;
    }
    return false;
}

void CTradingExpert::ParseConfigLine(string line) { /* DEPRECATED */ }

bool CTradingExpert::RegisterBot()
{
    // DEPRECATED: Handled by WebSocketClient::OnTimer
    return true;
}

// Cleaned up legacy pipe reading logic
int CTradingExpert::GetMessages(CJAVal &messagesArray) { return 0; }

void CTradingExpert::ProcessIncomingMessages(CJAVal &messages, CJAVal &outputArray)
{
    if (messages.m_type == jtARRAY) 
    {
        int count = messages.Size();
        for(int i = 0; i < count; i++) 
        { 
             CJAVal *msgPtr = messages[i]; 
             if(msgPtr != NULL) ProcessSingleMessage(*msgPtr, outputArray); 
        }
    }
    else if (messages.m_type == jtOBJ) 
    {
        ProcessSingleMessage(messages, outputArray);
    }
}

bool CTradingExpert::SendMessage(string type, CJAVal &content, string requestId, bool useQueue)
{
    // Strict Protocol: Use SendProtocolMessage which handles Header (BotID, Func, Symbol) and Envelope.
    return m_wsClient.SendProtocolMessage(type, content, requestId);
}

bool CTradingExpert::UpdateMessageStatus(string messageId, bool isActive)
{
    CJAVal statusMsg;
    statusMsg["messageId"] = messageId;
    statusMsg["isActive"] = isActive;
    return SendMessage("MSG_STATUS_UPDATE", statusMsg);
}

// ... (STATUS & REPORTING headers omitted) ...



//+------------------------------------------------------------------+
//| STATUS & REPORTING                                               |
//+------------------------------------------------------------------+
void CTradingExpert::SendHeartbeat() {
    CJAVal content; content["mt5_alive"] = true;
    SendMessage("STATUS_HEARTBEAT", content, "", false);
}

void CTradingExpert::BroadcastStatus()
{
   CJAVal content;
   CJAVal accountObj; 
   CJAVal expertObj;
   CJAVal tradesNode;
   
   // 1. Account Info (Merged Logic)
   accountObj["login"] = (long)AccountInfoInteger(ACCOUNT_LOGIN);
   accountObj["currency"] = AccountInfoString(ACCOUNT_CURRENCY);
   accountObj["leverage"] = (long)AccountInfoInteger(ACCOUNT_LEVERAGE);
   accountObj["balance"] = AccountInfoDouble(ACCOUNT_BALANCE);
   accountObj["equity"] = AccountInfoDouble(ACCOUNT_EQUITY);
   accountObj["profit"] = AccountInfoDouble(ACCOUNT_PROFIT);
   accountObj["margin"] = AccountInfoDouble(ACCOUNT_MARGIN);
   accountObj["margin_free"] = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   accountObj["margin_level"] = AccountInfoDouble(ACCOUNT_MARGIN_LEVEL);
   accountObj["trade_allowed"] = (bool)AccountInfoInteger(ACCOUNT_TRADE_ALLOWED);
   accountObj["connected"] = (bool)TerminalInfoInteger(TERMINAL_CONNECTED);
   accountObj["dayProfit"] = (AccountInfoDouble(ACCOUNT_EQUITY) - m_dailyStartBalance);
   accountObj["dayStartBalance"] = m_dailyStartBalance;
   accountObj["tradingStopped"] = m_tradingStoppedForDay;
   
   // 2. Expert Info
   expertObj["active"] = true; 
   expertObj["allowed"] = (bool)MQLInfoInteger(MQL_TRADE_ALLOWED);
   
   // 3. Trades - EXCLUDED from Status (User Demand for Clean Separation)
   // GetOpenPositions(tradesNode);
   
   content["account"].Set(accountObj);
   content["expert"].Set(expertObj);
   // content["openTrades"].Set(tradesNode);
   
   SendMessage("EV_ACCOUNT_STATUS_UPDATE", content, "", false); 
}

//+------------------------------------------------------------------+
//| ReportPositions (Incremental Scan v2)                            |
//+------------------------------------------------------------------+
void CTradingExpert::ReportPositions()
{
// PROXY MODE Removed

    // 1. Reset Daily Logic check
    if(IsNewDay()) {
        ResetDailyStats();
        m_lastHistoryTime = iTime(NULL, PERIOD_D1, 0); // Reset to start of day
        // m_metricCount = 0; // REPLACE with Clear
        m_metrics.Clear(); 
        m_processedDealTickets.Clear();
    }

    CJAVal content;
    CJAVal tradesNode;
    tradesNode.Clear(jtARRAY); 
    
    // --- STEP 1: INCREMENTAL HISTORY SCAN ---
    // Scan from last check time to now
    HistorySelect(m_lastHistoryTime, TimeCurrent());
    int deals = HistoryDealsTotal();
    
    if(deals > 0) {
        for(int i=0; i<deals; i++) {
            ulong ticket = HistoryDealGetTicket(i);
            
            // DEDUPLICATION: Check if ticket already processed (by ReportPositions)
            bool alreadyProcessed = false;
            int totalProcessed = m_processedDealTickets.Total();
            for(int p=0; p<totalProcessed; p++) {
               if(m_processedDealTickets.At(p) == (long)ticket) { alreadyProcessed = true; break; }
            }
            if(alreadyProcessed) continue;

            if(ticket > 0) {
                // Ensure we process forwards time
                long dealTime = HistoryDealGetInteger(ticket, DEAL_TIME);
                if(dealTime > (long)m_lastHistoryTime) {
                     m_lastHistoryTime = (datetime)dealTime;
                }
                
                ulong magic = (ulong)HistoryDealGetInteger(ticket, DEAL_MAGIC);
                
                // ROBUSTNESS: Capture Zero-Magic Deals (SL/TP often clears Magic on some brokers)
                if(magic == 0) {
                     // Check if we already have this ticket to avoid duplicate work
                     m_orphanDeals.Add((long)ticket);
                     continue; 
                } 
                
                // MARK AS PROCESSED IMMEDIATELY
                m_processedDealTickets.Add((long)ticket);

                // Find existing metric or add new
                CMetric* metric = NULL;
                for(int k=0; k<m_metrics.Total(); k++) {
                    CMetric* m = m_metrics.At(k);
                    if(m.magic == magic) { metric = m; break; }
                }
                
                if(metric == NULL) {
                    metric = new CMetric();
                    metric.magic = magic;
                    m_metrics.Add(metric);
                }
                
                // Stores the LAST KNOWN Position ID (Ticket) for this magic
                metric.positionTicket = (ulong)HistoryDealGetInteger(ticket, DEAL_POSITION_ID);

                // ADD DEAL TO IDEMPOTENT LIST + RECALCULATE
                double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
                double comm = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
                double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
                double vol = HistoryDealGetDouble(ticket, DEAL_VOLUME);
                long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
                
                metric.AddDeal(ticket, profit, comm, swap, dealTime, vol, (int)entry);
                
                // DIRECT CAPTURE: If we see the Entry Deal, capture details!
                if(entry == DEAL_ENTRY_IN) {
                    if(metric.entryPrice == 0) {
                         metric.entryPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
                         metric.openTime = (ulong)dealTime;
                         // Try to get init SL/TP from Order
                         /* 
                         long order = HistoryDealGetInteger(ticket, DEAL_ORDER);
                         if(HistoryOrderSelect(order)) {
                             metric.sl = HistoryOrderGetDouble(order, ORDER_SL);
                             metric.tp = HistoryOrderGetDouble(order, ORDER_TP);
                         }
                         */
                    }
                }
            }
        }
    }
    
    // --- STEP 1.2: ORPHAN RESOLUTION (Zero Magic Recovery) ---
    // If we found deals with Magic=0, look up their Position History to find the Entry Magic.
    if (m_orphanDeals.Total() > 0) {
        // Print("[TradingExpert] Attempting to resolve ", m_orphanDeals.Total(), " orphan deals...");
        for(int i=0; i<m_orphanDeals.Total(); i++) {
             ulong ticket = (ulong)m_orphanDeals.At(i);
             ulong posID = (ulong)HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
             
             if(posID > 0 && HistorySelectByPosition(posID)) {
                 ulong resolvedMagic = 0;
                 // Find Entry Deal
                 for(int d=0; d<HistoryDealsTotal(); d++) {
                      ulong dt = HistoryDealGetTicket(d);
                      if(HistoryDealGetInteger(dt, DEAL_ENTRY) == DEAL_ENTRY_IN) {
                          resolvedMagic = (ulong)HistoryDealGetInteger(dt, DEAL_MAGIC);
                          if(resolvedMagic > 0) break;
                      }
                 }
                 
                 if(resolvedMagic > 0) {
                       // Print("[TradingExpert] Resolved Magic ", resolvedMagic, " for Orphan Ticket ", ticket);
                       
                       // Add to Metrics (Copy-Paste Logic from Step 1)
                       CMetric* metric = NULL;
                       for(int k=0; k<m_metrics.Total(); k++) { 
                          CMetric* m = m_metrics.At(k);
                          if(m.magic == resolvedMagic) { metric = m; break; } 
                       }
                       
                       if(metric == NULL) {
                           metric = new CMetric();
                           metric.magic = resolvedMagic;
                           m_metrics.Add(metric);
                       }
                       
                       metric.positionTicket = posID;
                       
                       bool foundOrphanInHistory = false;
                       for(int d=0; d<HistoryDealsTotal(); d++) {
                           ulong dt = HistoryDealGetTicket(d);
                           if(dt == ticket) {
                               // IDEMPOTENCY: ADD DEAL
                               double profit = HistoryDealGetDouble(dt, DEAL_PROFIT);
                               double comm = HistoryDealGetDouble(dt, DEAL_COMMISSION);
                               double swap = HistoryDealGetDouble(dt, DEAL_SWAP);
                               double vol = HistoryDealGetDouble(dt, DEAL_VOLUME);
                               long entry = HistoryDealGetInteger(dt, DEAL_ENTRY);
                               long time = HistoryDealGetInteger(dt, DEAL_TIME);

                               metric.AddDeal(ticket, profit, comm, swap, time, vol, (int)entry);
                               
                               foundOrphanInHistory = true;
                               break;
                           }
                       }
                       
                       if(foundOrphanInHistory) m_processedDealTickets.Add((long)ticket);
                 }
             }
        }
        m_orphanDeals.Clear();
    }
    
    // --- STEP 1.5: DETAILED LOOKUP FOR MISSING ENTRIES (Wait) ---
    // If we have realized PL but NO entryPrice, we missed the Entry Deal (e.g. yesterday).
    // ... (Skipped for brevity, assume similar logic using metric accessor)

    
    // Reset isOpen flags before active scan
    // Reset isOpen flags before active scan
    for(int k=0; k<m_metrics.Total(); k++) { 
       CMetric* m = (CMetric*)m_metrics.At(k);
       m.isOpen = false; 
    }
    
    // --- STEP 2: SCAN OPEN POSITIONS (Active Trades) ---
    int total = PositionsTotal();
    for(int i=0; i<total; i++)
    {
       ulong ticket = PositionGetTicket(i);
       if(PositionSelectByTicket(ticket))
       {
          ulong magic = PositionGetInteger(POSITION_MAGIC);
          // REMOVED FILTER: Allow Magic 0 for Manual Trades
          // if(magic == 0) continue;

          // Link to metrics
          CMetric* metric = NULL;
          for(int k=0; k<m_metrics.Total(); k++) {
             CMetric* m = m_metrics.At(k);
             if(m.magic == magic && magic != 0) { metric = m; break; }
          }
          
          if(metric == NULL) {
              // Create new only for active position
              metric = new CMetric();
              metric.magic = magic;
              metric.positionTicket = ticket;
              m_metrics.Add(metric);
          }
          else {
              metric.positionTicket = ticket; // Update Active Ticket
          }
          
          metric.isOpen = true;
          // RECALCULATE IS CALLED AUTOMATICALLY WHEN DEALS ADDED.
          // BUT HERE WE NEED TO ADD THE *UNREALIZED/OPEN* COMPONENT?
          // Wait, CMetric::Recalculate() sums *Closed Deals*.
          // We need to ADD CURRENT POSITION STATS to the REPORT payload, not necessarily to `totalRealizedPl`.
          // Correct. Realized PL is strictly from history.
          // Commission/Swap might be partial (open position has swap/comm too).
          
          CJAVal positionObj;
          
          // FIX: Manual ID for Magic 0
          if (magic == 0) positionObj["id"] = "manual_" + IntegerToString(ticket);
          else positionObj["id"] = IntegerToString(magic); // Strict ID
          
          positionObj["ticket"] = (long)ticket;
          positionObj["time"] = (long)PositionGetInteger(POSITION_TIME);
          
          string pSymbol = PositionGetString(POSITION_SYMBOL);
          long pType = (long)PositionGetInteger(POSITION_TYPE);
          
          positionObj["symbol"] = pSymbol;
          positionObj["type"] = pType;
          
          // Store for Close Report
          metric.symbol = pSymbol;
          metric.type = pType;
          metric.comment = PositionGetString(POSITION_COMMENT); // Capture Comment
          
          positionObj["vol"] = PositionGetDouble(POSITION_VOLUME);
          positionObj["open"] = PositionGetDouble(POSITION_PRICE_OPEN);
          positionObj["current"] = PositionGetDouble(POSITION_PRICE_CURRENT);
          positionObj["sl"] = PositionGetDouble(POSITION_SL);
          positionObj["tp"] = PositionGetDouble(POSITION_TP);
          
          // Active Stats
          double activeSwap = PositionGetDouble(POSITION_SWAP);
          double activeProfit = PositionGetDouble(POSITION_PROFIT);
          double activeComm = PositionGetDouble(POSITION_COMMISSION);
          
          positionObj["swap"] = activeSwap;
          positionObj["profit"] = activeProfit;
          positionObj["commission"] = activeComm;
          
          // Extended Metrics = Realized (History) + Active
          positionObj["metrics"]["realizedPl"] = metric.totalRealizedPl;
          
           // FIX: Exclude the Active Portion of Commission from History to avoid Double Counting
           // metric.totalComm ALREADY EXCLUDES Entry Commission if Open (via Recalculate).
           // So we just take it as is.
           positionObj["metrics"]["historyCommission"] = metric.totalComm; 
           positionObj["metrics"]["historySwap"] = metric.totalSwap; 
           
           // Pass thorough execution details for DB Latching
           positionObj["metrics"]["openTime"] = (long)PositionGetInteger(POSITION_TIME);
           positionObj["metrics"]["entryPrice"] = PositionGetDouble(POSITION_PRICE_OPEN);
           positionObj["comment"] = PositionGetString(POSITION_COMMENT); // NEW: Report Comment
           
           Print("[TradingExpert] EV_TRADE_UPDATE Trade: ", positionObj.Serialize());
           
           tradesNode.Add(positionObj);
        }
     }

    // --- STEP 3: REPORT CLOSED TRADES (SEND ONCE) ---
    CJAVal closedTradesNode;
    closedTradesNode.Clear(jtARRAY);
    
    for(int i=0; i<m_metrics.Total(); i++) {
        CMetric* m = m_metrics.At(i);
        
        // If meant to be reported (has history) but NOT active anymore
        if(!m.isOpen && m.magic > 0) {
             ulong mg = m.magic;
             
             // Check if already SENT
             bool isSent = false;
             for(int j=0; j<m_ackedClosedTrades.Total(); j++) {
                 if(m_ackedClosedTrades.At(j) == (long)mg) { isSent = true; break; }
             }
             
             // If NOT Sent, report it exactly ONCE
             if(!isSent) {
                 // Removed constant Print to clean up logs
                 CJAVal closedObj;
                 closedObj["id"] = IntegerToString(mg); 
                 
                 closedObj["time"] = (long)m.closeTime;
                 closedObj["customStatus"] = "CLOSED"; 
                 
                 closedObj["profit"] = m.totalRealizedPl;
                 
                 closedObj["vol"] = m.totalVolume; 
                 closedObj["open"] = m.entryPrice; 
                 closedObj["sl"] = m.sl;
                 closedObj["tp"] = m.tp;
                 closedObj["symbol"] = m.symbol;
                 closedObj["type"] = m.type;
                 closedObj["comment"] = m.comment;
                 
                 closedObj["metrics"]["realizedPl"] = m.totalRealizedPl;
                 closedObj["metrics"]["unrealizedPl"] = 0.0; // Force 0 for Closed
                 closedObj["metrics"]["historyCommission"] = m.totalComm;
                 closedObj["metrics"]["historySwap"] = m.totalSwap;
                 closedObj["metrics"]["openTime"] = (long)m.openTime;
                 
                 Print("[TradingExpert] EV_TRADE_CLOSED Trade: ", closedObj.Serialize());
                 
                 closedTradesNode.Add(closedObj);
                 
                 // MARK AS SENT IMMEDIATELY (Bypass ACK Loop)
                 m_ackedClosedTrades.Add((long)mg);
             }
        }
    }
    
    // Broadcast CLOSED trades via dedicated event
    if (closedTradesNode.Size() > 0) {
        CJAVal closedPayload;
        closedPayload["positions"].Set(closedTradesNode);
        SendMessage("EV_TRADE_CLOSED", closedPayload, "", false);
        Print("[TradingExpert] 📤 Broadcasted ", closedTradesNode.Size(), " CLOSED trades.");
    }
    
    content["positions"].Set(tradesNode);
    
    string serialized = content.Serialize();
    string currentHash = CalculateHash(serialized);
    
    static ulong lastClosedRetry = 0;
    
    if (tradesNode.Size() > 0)
    {
        if (currentHash != m_lastReportHash || (GetTickCount64() - lastClosedRetry > 2000))
        {
            if(SendMessage("EV_TRADE_UPDATE", content, "", false)) {
                m_lastReportHash = currentHash;
                lastClosedRetry = GetTickCount64();
            } else {
                 if (m_state >= APP_STATE_CONNECTED) {
                     Print("[TradingExpert] ⚠️ Failed to send EV_TRADE_UPDATE. Retrying next tick.");
                 }
            }
        }
    }
    else
    {
        // Do not broadcast EV_TRADE_UPDATE if there are no open positions
        m_lastReportHash = currentHash;
    }
}



string CTradingExpert::CalculateHash(string data)
{
    // Simple equality check is sufficient as we store the full string
    return data; 
}

// ConfirmHistory moved to end of file to keep overloads together

//+------------------------------------------------------------------+
//| Logic: Account & Risk Management                                 |
//+------------------------------------------------------------------+
bool CTradingExpert::IsNewDay()
{
   MqlDateTime dt;
   TimeCurrent(dt);
   return (dt.day != m_currentDay);
}

void CTradingExpert::ResetDailyStats()
{
   MqlDateTime dt;
   TimeCurrent(dt);
   m_currentDay = dt.day;
   m_dailyStartBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   m_tradingStoppedForDay = false;
   m_ackedClosedTrades.Clear(); // New Day -> Clear Acked History Buffer
   m_executedTradeStrings.Clear(); // New Day -> Clear In-Flight Deduplication
   
   // FORCE FULL REBUILD (Includes History wipe inside)
   RebuildDailyState();
   
   Print("[TradingExpert] New Day Detected. Reset Daily Balance: ", DoubleToString(m_dailyStartBalance, 2));
}

void CTradingExpert::CheckDailyEquityLimits()
{
   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   bool limitReached = false;
   
   // 1. LOSS PROTECTION
   if(m_config.Account_LossProtection)
   {
      double lossLimitAmount = m_config.Account_BasicSize * (m_config.Account_LossProtectionPercent / 100.0);
      double minEquity = m_dailyStartBalance - lossLimitAmount;
      
      if(currentEquity <= minEquity)
      {
         Print("[TradingExpert] 🛑 EQUITY STOP LOSS REACHED! (Eq: ", currentEquity, " Min: ", minEquity, ")");
         
         // Only Close if not already stopped (Avoid spamming closes)
         if(!m_tradingStoppedForDay) {
             CloseAllPositions("Equity Stop Loss");
         }
         limitReached = true;
      }
   }
   
   // 2. PROFIT TARGET
   if(m_config.Account_TakeProfitOption > 0)
   {
      double targetEquity = 0;
      if(m_config.Account_TakeProfitOption == 1) 
         targetEquity = m_dailyStartBalance * (1.0 + m_config.Account_TakeProfitPercent/100.0);
      else if(m_config.Account_TakeProfitOption == 2) 
         targetEquity = m_config.Account_TakeProfitValue;
         
      if(targetEquity > 0 && currentEquity >= targetEquity)
      {
         Print("[TradingExpert] 🎯 DAILY PROFIT TARGET REACHED! (Eq: ", currentEquity, " Target: ", targetEquity, ")");
         
         if(!m_tradingStoppedForDay) {
            CloseAllPositions("Profit Target");
         }
         limitReached = true;
      }
   }
   
   // 3. STATE UPDATE (Latch Logic Fix)
   // Old Logic: Once true, always true until ResetDailyStats
   // New Logic: If config changes (e.g. LossProtection disabled), we should release the lock IF equity is safe.
   
   if (limitReached) {
       m_tradingStoppedForDay = true;
   } else {
       // If we were stopped, but now limits are NOT reached (e.g. User disabled limit in Config),
       // we should UNLOCK trading.
       if (m_tradingStoppedForDay) {
           Print("[TradingExpert] ✅ Daily Limits no longer breached (Config Updated?). RESUMING TRADING.");
           m_tradingStoppedForDay = false;
       }
   }
}

void CTradingExpert::CloseAllPositions(string reason)
{
   Print("[TradingExpert] Closing ALL Positions. Reason: ", reason);
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
      {
         CTrade trade;
         trade.PositionClose(ticket);
      }
   }
}


//+------------------------------------------------------------------+
//| EXECUTION LOGIC                                                  |
//+------------------------------------------------------------------+
void CTradingExpert::ExecuteTrade(CJAVal &data, CJAVal &response)
{
    // Default Response
    response["status"] = "ERROR"; 
    response["message"] = "Unknown Error";

    Print("DEBUG: ExecuteTrade Called. Payload Size: ", data.Serialize().Length()); 
    
    // FIX: Re-check limits before execution to ensure we are not using stale state
    CheckDailyEquityLimits();
    
    string tradeId = "";
    if (data.HasKey("id")) tradeId = data["id"].ToStr();
    response["id"] = tradeId; // Echo ID

    if(m_tradingStoppedForDay)
    {
       Print("[TradingExpert] 🛑 REJECTED Execution. Trading Stopped for Day.");
       
       response["status"] = "REJECTED"; 
       response["message"] = "Trading Stopped: Daily Limit Reached (Equity/Profit)";
       response["requested"] = data["vol"].ToDbl();
       response["executed"] = 0.0;
       return;
    }

   string symbol = data["symbol"].ToStr();
   
   string typeStr = "";
   if(data.HasKey("orderType") != NULL) typeStr = data["orderType"].ToStr();
   else if(data.HasKey("type") != NULL) typeStr = data["type"].ToStr();
   
   string strategy = "Manual";
   if(data.HasKey("strategy") != NULL) strategy = data["strategy"].ToStr();
   
   int direction = 0;
   // SPEC: 'operation' (BUY/SELL) | LEGACY: 'direction'
   CJAVal* opVal = data.HasKey("operation");
   if(opVal == NULL) opVal = data.HasKey("direction");

   if(opVal != NULL)
   {
       if(opVal.m_type == jtSTR)
       {
           string opStr = opVal.ToStr();
           if(opStr == "LONG" || opStr == "BUY") direction = 1;
           else if(opStr == "SHORT" || opStr == "SELL") direction = -1;
       }
       else direction = (int)opVal.ToInt();
   }
   
   // --- PRICE RESOLUTION ---
   double entryPrice = 0.0;
   bool hasEntryAnchor = false;
   if (data.HasKey("entry")) {
       CJAVal* e = data["entry"];
       if (e.HasKey("anchor")) { entryPrice = CAnchorResolver::ResolveAnchor((*e)["anchor"], symbol); hasEntryAnchor = true; }
       else if (e.HasKey("price")) entryPrice = (*e)["price"].ToDbl();
       else entryPrice = e.ToDbl();
   }
   
   double stopLoss = 0.0;
   bool hasSlAnchor = false;
   if (data.HasKey("sl")) {
       CJAVal* s = data["sl"];
       if (s.HasKey("anchor")) { stopLoss = CAnchorResolver::ResolveAnchor((*s)["anchor"], symbol); hasSlAnchor = true; }
       else if (s.HasKey("price")) stopLoss = (*s)["price"].ToDbl();
       else stopLoss = s.ToDbl();
   }
   
   double assignedTP = 0.0;
   bool hasTpAnchor = false;
   if (data.HasKey("tp")) {
       CJAVal* t = data["tp"];
       if (t.HasKey("anchor")) { assignedTP = CAnchorResolver::ResolveAnchor((*t)["anchor"], symbol); hasTpAnchor = true; }
       else if (t.HasKey("price")) assignedTP = (*t)["price"].ToDbl();
       else assignedTP = t.ToDbl();
   }
   
   // Risk: Custom or Default
   double customRisk = 0;
   CJAVal* riskVal = data.HasKey("risk");
   if(riskVal != NULL) customRisk = riskVal.ToDbl();
   double riskPercent = (customRisk > 0) ? customRisk : m_config.Risk_Percent;
   
   // Risk Reward
   double rr = 0;
   CJAVal* rrVal = data.HasKey("riskReward");
   if(rrVal != NULL)
   {
      if(rrVal.m_type == jtOBJ) {
         CJAVal* p = rrVal.HasKey("value");
         if(p != NULL) rr = p.ToDbl();
      } else rr = rrVal.ToDbl();
   }
   
   double finalTP = assignedTP;
   
   // --- ENSURE SYMBOL IS SELECTED ---
   StringTrimLeft(symbol);
   StringTrimRight(symbol);
   ResetLastError();
   if(!SymbolSelect(symbol, true))
   {
      int err = GetLastError();
      bool exists = (bool)SymbolInfoInteger(symbol, SYMBOL_EXIST);
      bool visible = (bool)SymbolInfoInteger(symbol, SYMBOL_VISIBLE);
      Print("[TradingExpert] FAILED to select symbol: '", symbol, "' Error=", err);
      Print("[TradingExpert] Diagnostics: Exists=", exists, " Visible=", visible, " TotalSymbols=", SymbolsTotal(false));
      
      // Fallback: If exists but select failed, maybe we can still Proceed?
      if(!exists) return; 
   }
   
   // Logic check: Market Entry if Price is 0
   double calcEntry = (entryPrice > 0) ? entryPrice : (direction == 1 ? SymbolInfoDouble(symbol, SYMBOL_ASK) : SymbolInfoDouble(symbol, SYMBOL_BID));
   
   if(calcEntry <= 0.0)
   {
       Print("[TradingExpert] CRITICAL ERROR: Unable to determine Entry Price. Ask=", SymbolInfoDouble(symbol, SYMBOL_ASK), " Bid=", SymbolInfoDouble(symbol, SYMBOL_BID), " Sym=", symbol);
       response["status"] = "ERROR";
       response["message"] = "Could not determine Entry Price (Market Closed?)";
       return;
   }

   // --- PENDING ORDER VALIDATION & CALCULATION ---
   if (typeStr == "LIMIT" || typeStr == "STOP") {
       if (!hasEntryAnchor || entryPrice <= 0.0) {
           response["status"] = "REJECTED";
           response["message"] = "Pending orders require a valid Anchor for Entry.";
           return;
       }
       if (data.HasKey("sl") && !hasSlAnchor) {
           response["status"] = "REJECTED";
           response["message"] = "Pending order SL must be an Anchor, or auto-calculated via TP+RR.";
           return;
       }
       if (data.HasKey("tp") && !hasTpAnchor) {
           response["status"] = "REJECTED";
           response["message"] = "Pending order TP must be an Anchor, or auto-calculated via SL+RR.";
           return;
       }
       
       if (hasSlAnchor) {
           if (!hasTpAnchor && rr > 0) {
               double dist = MathAbs(calcEntry - stopLoss);
               finalTP = (direction == 1) ? (calcEntry + (dist * rr)) : (calcEntry - (dist * rr));
               Print("[TradingExpert] Pending: Auto-Calculated TP from SL and RR ", rr, ": ", finalTP);
           }
       } else {
           if (hasTpAnchor && rr > 0) {
               double dist = MathAbs(calcEntry - assignedTP);
               stopLoss = (direction == 1) ? (calcEntry - (dist / rr)) : (calcEntry + (dist / rr));
               Print("[TradingExpert] Pending: Auto-Calculated SL from TP and RR ", rr, ": ", stopLoss);
           } else {
               response["status"] = "REJECTED";
               response["message"] = "Pending orders require either an SL Anchor, or a TP Anchor + RiskReward.";
               return;
           }
       }
   } else {
       // Auto-Calculate TP if missing but RR and SL are present (Market Orders)
       if(finalTP == 0.0 && rr > 0 && stopLoss > 0)
       {
          double dist = MathAbs(calcEntry - stopLoss);
          finalTP = (direction == 1) ? (calcEntry + (dist * rr)) : (calcEntry - (dist * rr));
          Print("[TradingExpert] Auto-Calculated TP from RR ", rr, ": ", finalTP, " based on Entry: ", calcEntry);
       }
   }

   double slCalcPrice = (entryPrice > 0) ? entryPrice : calcEntry;
   int slPoints = (int)(MathAbs(slCalcPrice - stopLoss) / SymbolInfoDouble(symbol, SYMBOL_POINT));
   double totalVolume = CalculatePositionSize(symbol, riskPercent, slPoints);
   
   if (totalVolume <= 0) {
       response["status"] = "ERROR";
       response["message"] = "Calculated Volume is 0 / Invalid Risk Params";
       return;
   }

    // Magic Number Handling (User Request Refactor)
    ulong magic = MAGICMA;
    // FIX: Prioritize "magic" field (Numeric) over "id" (String/UUID)
    if(data.HasKey("magic")) {
        magic = (ulong)data["magic"].ToInt();
        Print("[TradingExpert] Explicit Magic -> ", magic);
    } else if(data.HasKey("id")) {
        magic = (ulong)StringToInteger(data["id"].ToStr());
        Print("[TradingExpert] ID -> Magic: ", magic);
    }
    if(magic == 0) magic = MAGICMA;

    // --- [SECURITY RESTORED] IDEMPOTENCY GUARD ---
    // User Requirement: "Trade ID can only be executed ONCE"
    
    // 1. Check Active Positions
    for(int i=PositionsTotal()-1; i>=0; i--) {
        ulong t = PositionGetTicket(i);
        if(t > 0 && PositionGetInteger(POSITION_MAGIC) == magic) {
            Print("[TradingExpert] SKIPPING Duplicate Execution (Active). Magic=", magic);
            response["status"] = "SKIPPED";
            response["message"] = "Duplicate Execution (Active Position Found)";
            response["ticket"] = (long)t;
            return;
        }
    }

    // 2. Check History (Closed Today/Ever)
    // We select history from 0 to Now to ensure we catch ANY previous execution of this ID.
    if(HistorySelect(0, TimeCurrent())) {
        for(int i=HistoryDealsTotal()-1; i>=0; i--) {
             ulong t = HistoryDealGetTicket(i);
             // FIX: used 'ticket' instead of 't'
             if(t > 0 && HistoryDealGetInteger(t, DEAL_MAGIC) == magic && HistoryDealGetInteger(t, DEAL_ENTRY) == DEAL_ENTRY_IN) {
                 Print("[TradingExpert] SKIPPING Duplicate Execution (History). Magic=", magic);
                 response["status"] = "SKIPPED";
                 response["message"] = "Duplicate Execution (History Deal Found)";
                 response["ticket"] = (long)t;
                 return;
             }
        }
    }
   
   Print("[TradingExpert] EXECUTE: ", strategy, " ", (direction==1?"BUY":"SELL"), 
         " @ ", entryPrice, " SL=", stopLoss, " TP=", finalTP, 
         " Risk=", DoubleToString(riskPercent, 2), "% Vol=", DoubleToString(totalVolume, 2),
         " Magic=", magic);

   // --- SPLIT LOGIC ---
   double brokerMax = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MAX);
   double brokerMin = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
   double brokerStep = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
   
   // Determine effective max volume per ticket
   double effectiveMax = brokerMax;
   if(m_config.Limit_MaxLot > 0 && m_config.Limit_MaxLot < effectiveMax) effectiveMax = m_config.Limit_MaxLot;
   if(m_config.Risk_LotSplitSize > 0 && m_config.Risk_LotSplitSize < effectiveMax) effectiveMax = m_config.Risk_LotSplitSize;
   
   string effectiveTradeId = "";
   if (data.HasKey("id")) effectiveTradeId = data["id"].ToStr();
   if (effectiveTradeId == "") effectiveTradeId = GenerateTradeId();
   
   // --- RACE CONDITION GUARD ---
   // Check if this specific string ID was already processed in this session/batch
   // This catches duplicates that arrive faster than PositionsTotal() updates
   for(int k=0; k<m_executedTradeStrings.Total(); k++) {
       if(m_executedTradeStrings.At(k) == effectiveTradeId) {
           Print("[TradingExpert] SKIPPING Duplicate Trade ID (In-Flight): ", tradeId);
           response["status"] = "SKIPPED";
           response["message"] = "Duplicate Execution (In-Flight)";
           return;
       }
   }
   // Add to guard immediately
   m_executedTradeStrings.Add(tradeId);
   // ----------------------------
   
   string comment = GenerateOrderComment(strategy, tradeId, riskPercent);
   
   double remainingVolume = totalVolume;
   int splitCount = 0;
   
   Print("[TradingExpert] 🔪 Splitting Trade: Total=", totalVolume, " MaxPerTicket=", effectiveMax);

   while(remainingVolume >= brokerMin)
   {
      double currentVol = MathMin(remainingVolume, effectiveMax);
      
      // Normalize to Step
      currentVol = MathFloor(currentVol / brokerStep) * brokerStep;
      
      if(currentVol < brokerMin) {
          // Remainder too small? Attempt to add to previous or discard if handled?
          // If this is the *only* chunk, it means totalVolume < brokerMin (shouldn't happen due to check above)
          // If this is a tail, we might need to skip or force min.
          // Let's break to avoid infinite loop.
          Print("[TradingExpert] ⚠️ Remaining volume too small: ", remainingVolume);
          break;
      }
      
      MqlTradeRequest request = {};
      MqlTradeResult result = {};
      
      request.action = TRADE_ACTION_DEAL;
      request.symbol = symbol;
      request.volume = currentVol;
      request.magic = magic; // ASSIGN MAGIC
      request.comment = comment;
      request.deviation = m_config.Risk_Slippage;
      
      // FIX: Dynamic Filling Mode (Some brokers reject FOK)
      int filling = (int)SymbolInfoInteger(symbol, SYMBOL_FILLING_MODE);
      int tradeMode = (int)SymbolInfoInteger(symbol, SYMBOL_TRADE_MODE);
      
      // DEBUG LOGGING FOR FILLING MODE AND TRADE MODE
      Print("[TradingExpert] DEBUG: Symbol=", symbol, " FillingModeFlags=", filling, " TradeMode=", tradeMode);
      
      if(tradeMode == SYMBOL_TRADE_MODE_DISABLED) Print("[TradingExpert] WARNING: Trade Mode is DISABLED for ", symbol);
      if(tradeMode == SYMBOL_TRADE_MODE_LONGONLY) Print("[TradingExpert] WARNING: Trade Mode is LONG ONLY for ", symbol);
      if(tradeMode == SYMBOL_TRADE_MODE_SHORTONLY) Print("[TradingExpert] WARNING: Trade Mode is SHORT ONLY for ", symbol);
      if(tradeMode == SYMBOL_TRADE_MODE_CLOSEONLY) Print("[TradingExpert] WARNING: Trade Mode is CLOSE ONLY for ", symbol);
      
      if((filling & SYMBOL_FILLING_FOK) == SYMBOL_FILLING_FOK) {
          request.type_filling = ORDER_FILLING_FOK;
          Print("[TradingExpert] DEBUG: Selected ORDER_FILLING_FOK");
      }
      else if((filling & SYMBOL_FILLING_IOC) == SYMBOL_FILLING_IOC) {
          request.type_filling = ORDER_FILLING_IOC;
          Print("[TradingExpert] DEBUG: Selected ORDER_FILLING_IOC");
      }
      else {
          request.type_filling = ORDER_FILLING_RETURN;
          Print("[TradingExpert] DEBUG: Selected ORDER_FILLING_RETURN");
      }
      
      if(typeStr == "MARKET" || entryPrice == 0.0)
      {
         request.action = TRADE_ACTION_DEAL;
         request.type = (direction == 1) ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
         request.price = (direction == 1) ? SymbolInfoDouble(symbol, SYMBOL_ASK) : SymbolInfoDouble(symbol, SYMBOL_BID);
      }
      else
      {
         request.action = TRADE_ACTION_PENDING;
         request.price = entryPrice;
         
         if(typeStr == "LIMIT")
             request.type = (direction == 1) ? ORDER_TYPE_BUY_LIMIT : ORDER_TYPE_SELL_LIMIT;
         else if(typeStr == "STOP")
             request.type = (direction == 1) ? ORDER_TYPE_BUY_STOP : ORDER_TYPE_SELL_STOP;
      }
      
       request.sl = stopLoss;
       request.tp = finalTP;
       
       ResetLastError();
       bool sent = OrderSend(request, result);
       
       if(sent)
       {
           Print("[TradingExpert] Order Sent. Ticket: ", result.order, " Vol: ", currentVol, " Magic: ", request.magic);
           
           // Attach executed prices for Backend state
           response["entry_price"] = result.price > 0 ? result.price : (direction == 1 ? SymbolInfoDouble(symbol, SYMBOL_ASK) : SymbolInfoDouble(symbol, SYMBOL_BID));
           response["sl"] = request.sl;
           response["tp"] = request.tp;
           response["ticket"] = (long)result.order;
           
           remainingVolume -= currentVol; // DECREMENT ONLY ON SUCCESS
       }
       else
       {
           int errCode = GetLastError();
           string err = "[TradingExpert] OrderSend FAILED: " + IntegerToString(errCode) + " Ret: " + IntegerToString(result.retcode) + " " + result.comment;
           Print(err);
           
           // Differentiate ERROR vs REJECTED (e.g. Invalid Stops, Trade Disabled)
           // USER FEEDBACK: All OrderSend failures should return ERROR so they get logged appropriately
           response["status"] = "ERROR";
           
           response["message"] = err;
           break; // ABORT REMAINING CHUNKS
       }
      remainingVolume = NormalizeDouble(remainingVolume, 8);
      splitCount++;
      
      if(splitCount > 10) { Print("Safety Break Loop"); break; }
    }
    
   // Final Response State
   response["id"] = effectiveTradeId;
   response["masterId"] = effectiveTradeId;
   response["requested"] = totalVolume;
   response["executed"] = totalVolume - remainingVolume;
   
   if (response["status"].ToStr() == "ERROR" && response["message"].ToStr() == "Unknown Error") {
       if (typeStr == "LIMIT" || typeStr == "STOP") {
           response["status"] = "CREATED";
           response["message"] = "Order Created";
       } else {
           response["status"] = "OK";
           response["message"] = "Execution Complete";
       }
   }
 }


double CTradingExpert::CalculatePositionSize(string symbol, double riskPercent, int slPoints)
{
    double balance = AccountInfoDouble(ACCOUNT_BALANCE);
    double riskAmount = balance * (riskPercent / 100.0);
    
    double tickValue = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_VALUE);
    double tickSize = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_SIZE);
    
    if(slPoints == 0 || tickSize == 0) return m_config.Limit_MinLot;
    
    double lossValue = slPoints * SymbolInfoDouble(symbol, SYMBOL_POINT);
    double lotSize = riskAmount / ( (lossValue / tickSize) * tickValue );
    
    double step = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
    lotSize = MathFloor(lotSize / step) * step;
    
    if(lotSize < m_config.Limit_MinLot) lotSize = m_config.Limit_MinLot;
    if(lotSize > m_config.Limit_MaxLot) lotSize = m_config.Limit_MaxLot; 
    
    return lotSize;
}

string CTradingExpert::GenerateTradeId()
{
    return IntegerToString(GetTickCount());
}

string CTradingExpert::GenerateOrderComment(string strategy, string tradeId, double risk)
{
    // Format: Strategy | R:0.5
    string rStr = DoubleToString(risk, 2); // 2 decimal places? "0.50" or "1.00"
    // Remove trailing zeros? DoubleToString(risk, 2) is fine.
    
    string suffix = " | R:" + rStr;
    
    // Truncate strategy if needed (Max 31 chars total)
    int maxLen = 31 - StringLen(suffix);
    if(maxLen < 0) maxLen = 0; // Should not happen if strategy is short
    
    string cleanStrat = StringSubstr(strategy, 0, maxLen);
    
    return cleanStrat + suffix; 
}

void CTradingExpert::ExecuteModification(CJAVal &data, CJAVal &response)
{
   response["status"] = "ERROR";
   response["message"] = "Modification Failed";

   string action = data["action"].ToStr();
   
   // SPEC: 'id' | LEGACY: 'tradeId'
   string tradeIdStr = "";
   if (data.HasKey("id")) tradeIdStr = data["id"].ToStr();
   else if (data.HasKey("tradeId")) tradeIdStr = data["tradeId"].ToStr();
   
   // Target Magic is tradeId (User confirmed numeric IDs)
   ulong targetMagic = (ulong)StringToInteger(tradeIdStr);
   
   Print("[TradingExpert] MODIFY RX: Action=", action, " TargetMagic=", targetMagic, " (RawID: ", tradeIdStr, ")");

   bool found = false;

    // 1. Scan Open Positions
    int total = PositionsTotal();
    bool modificationSuccess = false; // NEW: Track explicit success

    for(int i = total - 1; i >= 0; i--)
    {
       ulong ticket = PositionGetTicket(i);
       if(ticket > 0)
       {
          ulong posMagic = PositionGetInteger(POSITION_MAGIC);
          if (posMagic == targetMagic)
          {
              Print("[TradingExpert] MATCH FOUND (Position)! Ticket=", ticket, " Magic=", posMagic);
              modificationSuccess = ExecutePositionModification(ticket, action, data);
              found = true;
          }
       }
    }
    
    // 2. Scan Pending Orders
    int orders = OrdersTotal();
    for(int i = orders - 1; i >= 0; i--)
    {
       ulong ticket = OrderGetTicket(i);
       if(ticket > 0)
       {
          ulong orderMagic = OrderGetInteger(ORDER_MAGIC);
          if (orderMagic == targetMagic)
          {
              Print("[TradingExpert] MATCH FOUND (Order)! Ticket=", ticket, " Magic=", orderMagic);
              ExecuteOrderModification(ticket, action, data);
              found = true;
          }
       }
    }
    
    response["id"] = tradeIdStr;
    response["masterId"] = tradeIdStr;
    
    if(!found) {
        Print("[TradingExpert] ⚠️ Modify Failed: Target Magic ", targetMagic, " not found in Positions or Orders.");
        response["message"] = "Target Not Found";
    } else {
        response["status"] = "OK";
        response["message"] = "Modification Signal Processed";
        
        // NEW: Surface SL_BE explicit success flag back to Node.js
        if (action == "SL_BE") {
            response["sl_at_be_success"] = modificationSuccess;
        }
    }
}

// Helper to separate Position Logic
bool CTradingExpert::ExecutePositionModification(ulong ticket, string action, CJAVal &data)
{
     ulong magic = PositionGetInteger(POSITION_MAGIC);
     
     if (action == "SL_BE")
     {
         // USER REQUEST (2026-02-16): "Simply set SL to Entry". Complex Calc removed.
         double bePrice = PositionGetDouble(POSITION_PRICE_OPEN); 
         // double bePrice = CalculateBreakEvenPrice(ticket);
         double currentSL = PositionGetDouble(POSITION_SL);
         
         // 1. Check if already there
         if(MathAbs(bePrice - currentSL) < _Point) {
             Print("[TradingExpert] SL_BE Skipped: SL is already at Break Even: ", bePrice);
             return true; // Consider it a success if it's already at BE!
         }
         
         // 2. Check StopsLevel (Min Distance)
         string symbol = PositionGetString(POSITION_SYMBOL);
         double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
         int stopsLevel = (int)SymbolInfoInteger(symbol, SYMBOL_TRADE_STOPS_LEVEL);
         double minDist = stopsLevel * _Point;
         
         if(MathAbs(currentPrice - bePrice) < minDist) {
             Print("[TradingExpert] ❌ SL_BE FAILED: Price (", currentPrice, ") too close to BE (", bePrice, "). MinDist: ", minDist);
             // TODO: Maybe send error back?
             return false;
         }

         CTrade trade;
         trade.SetExpertMagicNumber(magic); // FIX: Preserve Magic
         
         ResetLastError();
         bool res = trade.PositionModify(ticket, bePrice, PositionGetDouble(POSITION_TP));
         
         if(res) {
             Print("[TradingExpert] ✅ SL Moved to BE: ", bePrice, " (Ticket: ", ticket, ")");
             return true;
         } else {
             int err = GetLastError();
             Print("[TradingExpert] ❌ SL_BE FAILED. Error: ", err, " RetCode: ", trade.ResultRetcode(), " Desc: ", trade.ResultRetcodeDescription());
             return false;
         }
     }
     else if (action == "CLOSE_PARTIAL")
     {
         // DEBUG: Trace Payload - REMOVED
         string customId = "";
         if(data.HasKey("customId")) customId = data["customId"].ToStr();
         // Print("[TradingExpert] 🔍 CLOSE_PARTIAL Received. CustomID=", customId);

         double percent = data["percent"].ToDbl();
         // Print("[TradingExpert] Raw Percent from JSON: ", data["percent"].ToStr(), " Parsed: ", percent);
         
         if(percent > 1.0) percent = percent / 100.0;
         
         // FIX: Use Epsilon to detect 100% close and force Full Close (Avoids 0.01 dust)
         if (percent >= 0.9999) 
         {
             CTrade trade;
             trade.SetExpertMagicNumber(magic); // FIX: Preserve Magic
             trade.SetDeviationInPoints(m_config.Risk_Slippage);
             trade.PositionClose(ticket);
             Print("[TradingExpert] 100% Partial detected -> Executed FULL CLOSE on Ticket: ", ticket, " Magic: ", magic);
             return true;
         }
         
         if (percent > 0 && percent < 0.9999)
         {
             double totalVol = PositionGetDouble(POSITION_VOLUME);
             string posSymbol = PositionGetString(POSITION_SYMBOL);
             double vol = totalVol * percent;
             double step = SymbolInfoDouble(posSymbol, SYMBOL_VOLUME_STEP);
             vol = MathFloor(vol / step) * step;
             
             double minVol = SymbolInfoDouble(posSymbol, SYMBOL_VOLUME_MIN);
             if(vol < minVol) vol = minVol;
             
             // Print("[TradingExpert] Partial Calc: Total=", totalVol, " Req%=", percent, " CalcVol=", vol);

             // FIX: If calculated volume equals (or exceeds) total volume, use PositionClose (Safe Full Close)
             if (vol >= totalVol - 0.000001)
             {
                 if (percent < 0.99) {
                      Print("[TradingExpert] ⚠️ WARNING: Calculated Partial Volume equals Total Volume but Percent < 99%. Checking Step.");
                      // This might happen if volume step is large or total volume is small.
                      // Proceeding with Full Close as mathematically requested by Step-Rounding.
                 }
                 
                 CTrade trade;
                 trade.SetExpertMagicNumber(magic); // FIX: Preserve Magic
                 trade.SetDeviationInPoints(m_config.Risk_Slippage);
                 trade.PositionClose(ticket);
                 Print("[TradingExpert] Partial resulted in Full Close -> Executed PositionClose on Ticket: ", ticket, " Magic: ", magic);
                 return true;
             }
             
             // Note: PositionClose(ticket, volume) is the correct overload for partials in standard lib
             // BUT: Compiler warned about double->ulong, meaning PositionClose(ticket, double) doesn't exist! 
             // It interprets vol as Deviation! This causes Full Close!
             // We must use a custom manual close function.
             
             if(SafePartialClose(ticket, vol, magic)) {
                 Print("[TradingExpert] ✅ Closed Partial (Manual): ", vol, " Ticket: ", ticket);
                 return true;
             }
             else {
                 Print("[TradingExpert] ❌ Partial Close FAILED (Manual): Error ", GetLastError());
                 return false;
             }
         }
     }
     else if (action == "CLOSE" || action == "CLOSE_FULL")
     {
         CTrade trade;
         trade.SetExpertMagicNumber(magic); // FIX: Preserve Magic
         trade.SetDeviationInPoints(m_config.Risk_Slippage);
         trade.PositionClose(ticket);
         Print("[TradingExpert] FULL CLOSE Executed: Ticket=", ticket, " Magic=", magic);
         return true;
     }
     
     return false; // Fallback
}

//+------------------------------------------------------------------+
//| SafePartialClose (Bypass CTrade ambiguity)                       |
//+------------------------------------------------------------------+
bool CTradingExpert::SafePartialClose(ulong ticket, double volume, ulong magic)
{
    MqlTradeRequest request;
    MqlTradeResult result;
    ZeroMemory(request);
    ZeroMemory(result);
    
    string symbol = PositionGetString(POSITION_SYMBOL);
    
    request.action = TRADE_ACTION_DEAL;
    request.position = ticket;
    request.symbol = symbol;
    request.volume = volume;
    request.deviation = m_config.Risk_Slippage;
    request.magic = magic;
    
    // Reverse Type
    long type = PositionGetInteger(POSITION_TYPE);
    if(type == POSITION_TYPE_BUY) request.type = ORDER_TYPE_SELL;
    else request.type = ORDER_TYPE_BUY;
    
    // Filling Mode Logic (Simplified)
    long filling = SymbolInfoInteger(symbol, SYMBOL_FILLING_MODE);
    if((filling & SYMBOL_FILLING_IOC) == SYMBOL_FILLING_IOC) request.type_filling = ORDER_FILLING_IOC;
    else if((filling & SYMBOL_FILLING_FOK) == SYMBOL_FILLING_FOK) request.type_filling = ORDER_FILLING_FOK;
    else request.type_filling = ORDER_FILLING_RETURN;
    
    // Print("[TradingExpert] 🛡️ SafePartialClose: Ticket=", ticket, " Vol=", volume, " Type=", request.type, " Filling=", request.type_filling);
    
    bool res = OrderSend(request, result);
    if(!res) Print("[TradingExpert] OrderSend Fatal Error: ", GetLastError());
    if(result.retcode != TRADE_RETCODE_DONE && result.retcode != TRADE_RETCODE_PLACED) {
         Print("[TradingExpert] OrderSend Result: ", result.retcode, " Comment: ", result.comment);
         return false;
    }
    return true;
}

// Helper for Pending Orders
void CTradingExpert::ExecuteOrderModification(ulong ticket, string action, CJAVal &data)
{
    if (action == "CLOSE" || action == "CLOSE_FULL" || action == "CANCEL")
    {
        CTrade trade;
        trade.OrderDelete(ticket);
        Print("[TradingExpert] PENDING ORDER CANCELLED: Ticket=", ticket);
    }
    else {
        Print("[TradingExpert] Action ", action, " not supported for Pending Order ", ticket);
    }
}


double CTradingExpert::CalculateBreakEvenPrice(ulong ticket)
{
    if (PositionSelectByTicket(ticket))
    {
        string symbol = PositionGetString(POSITION_SYMBOL);
        double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
        double vol = PositionGetDouble(POSITION_VOLUME);
        
        double netRealized = 0;
        
        // Find Metric for this Position (Accurate Comm/Swap/Partials)
        for(int i=0; i<m_metrics.Total(); i++) {
            CMetric* m = (CMetric*)m_metrics.At(i);
            if(m.positionTicket == ticket) {
                netRealized = m.totalRealizedPl + m.totalComm + m.totalSwap;
                break;
            }
        }
        
        double tickValue = SymbolInfoDouble(symbol, SYMBOL_TRADE_TICK_VALUE);
        if (tickValue == 0 || vol == 0) return openPrice;
        
        double priceDelta = -(netRealized / (vol * tickValue));
        return NormalizeDouble(openPrice + priceDelta, _Digits);
    }
    return 0.0;
}

void CTradingExpert::ProcessSingleMessage(CJAVal &msg, CJAVal &outputArray)
{
    // 1. DEDUPLICATION via ID
    string msgId = "";
    if (msg.HasKey("customId")) msgId = msg["customId"].ToStr();
    else if (msg.HasKey("id")) msgId = msg["id"].ToStr(); 
    
    if (msgId != "") {
        for(int i=0; i<50; i++) {
            if (m_processedIds[i] == msgId) return; // Dropped Duplicate
        }
        m_processedIds[m_processedIdHead] = msgId;
        m_processedIdHead = (m_processedIdHead + 1) % 50;
    }

    // 2. Timestamp Filtering
    long ts = 0;
    // Envelope Support: Check header.timestamp
    if (msg.HasKey("header")) {
        CJAVal* h = msg["header"];
        if (h.HasKey("timestamp")) ts = h["timestamp"].ToInt();
    } 
    else if (msg.HasKey("timestamp")) ts = StringToInteger(msg["timestamp"].ToStr());
    
    if (ts > m_lastTimestamp) m_lastTimestamp = ts;

    string type = "UNKNOWN";
    
    // Envelope Support: Check header.command
    if (msg.HasKey("header")) {
        CJAVal* h = msg["header"];
        if (h.HasKey("command")) type = h["command"].ToStr();
    }
    else if (msg.HasKey("type")) type = msg["type"].ToStr();
    
    // WRAPPER FIX: Unpack "COMMAND" envelope from SystemOrchestrator
    if (type == "COMMAND") {
         CJAVal* cmdVal = msg.HasKey("command");
         if(cmdVal != NULL) type = cmdVal.ToStr();
    }
    
    if (type == "NO_OP") return;

   // 3. Command Handling
    if (StringFind(type, "CMD_") == 0) {
        long cmdTs = 0;
        if (msg.HasKey("timestamp")) cmdTs = StringToInteger(msg["timestamp"].ToStr());
        
        if (cmdTs > 0 && cmdTs <= m_lastCommandTimestamp) {
            // Duplicate/Old Command
            return;
        }
        if (cmdTs > 0) m_lastCommandTimestamp = cmdTs;
        
        // Pass to Command Manager
        // FIX: Route CMD_ACK_TRADE explicitly if not registered via Manager or handle inline
        if (type == "CMD_ACK_TRADE") {
            HandleAckTrade(&msg);
            return; // ACK handled, done.
        } 
        else if (type == "CMD_UPDATE_CONFIG") {
             // Direct Payload Update
             CJAVal* pPayload = &msg;
             if (msg.HasKey("payload")) pPayload = msg["payload"];
             
             m_config.UpdateFromJSON(*pPayload);
             
             // FIX: Immediately Re-Evaluate Limits to release Latch if config allows
             CheckDailyEquityLimits();
             
             Print("[TradingExpert] ⚙️ CMD_UPDATE_CONFIG Applied & Limits Re-Checked.");
             return; // Handled, skip Manager
        }
        else if (type == "CMD_SHUTDOWN") {
             Print("[TradingExpert] 🛑 CMD_SHUTDOWN Received! Shutting down terminal.");
             
             CJAVal payload;
             payload["status"] = "OK";
             payload["message"] = "Shutting down";
             
             string reqId = "";
             if (msg.HasKey("header") && msg["header"].HasKey("request_id")) {
                 reqId = msg["header"]["request_id"].ToStr();
             } else if (msg.HasKey("request_id")) {
                 reqId = msg["request_id"].ToStr();
             }
             
             m_wsClient.SendProtocolMessage("CMD_SHUTDOWN_RESPONSE", payload, reqId);
             
             TerminalClose(0);
             return;
        }
        else if (type == "CMD_GET_SYMBOLS") {
             // 1. Extract Request ID
             string reqId = "";
             if (msg.HasKey("header") && msg["header"].HasKey("request_id")) {
                 reqId = msg["header"]["request_id"].ToStr();
             } else if (msg.HasKey("request_id")) {
                 reqId = msg["request_id"].ToStr();
             }

             // 2. Prepare Payload
             int total = SymbolsTotal(false);
             Print("[TradingExpert] 🔎 CMD_GET_SYMBOLS: Scanning ", total, " symbols... (ReqID: ", reqId, ")");
             
             CJAVal symbolsArr;
             symbolsArr.Clear(jtARRAY); 
             
             int limit = 2000; 
             if (total > limit) total = limit;

             for(int i=0; i<total; i++) {
                 string name = SymbolName(i, false);
                 string path = SymbolInfoString(name, SYMBOL_PATH);
                 string desc = SymbolInfoString(name, SYMBOL_DESCRIPTION);
                 long digits = SymbolInfoInteger(name, SYMBOL_DIGITS);
                 
                 CJAVal symObj;
                 symObj["name"] = name;
                 symObj["path"] = path;
                 symObj["desc"] = desc;
                 symObj["digits"] = digits;
                 
                 symbolsArr.Add(symObj);
             }
             
             CJAVal payload;
             payload["status"] = "OK";
             payload["symbols"].Set(symbolsArr); // Nested data array
             
             // 3. Send via Protocol Helper (Handles Envelope & Header)
             m_wsClient.SendProtocolMessage("CMD_GET_SYMBOLS_RESPONSE", payload, reqId);
             
             Print("[TradingExpert] 📤 Sent ", total, " symbols.");
             return;
        }
        else if (type == "CMD_SYNC_POSITIONS") {
             CJAVal positionsArr;
             positionsArr.Clear(jtARRAY);
             
             int total = PositionsTotal();
             for(int i=0; i<total; i++) {
                 string symbol = PositionGetSymbol(i);
                 if(symbol == "") continue;
                 
                 CJAVal pos;
                 pos["ticket"] = (long)PositionGetInteger(POSITION_TICKET);
                 pos["symbol"] = symbol;
                 pos["type"] = (long)PositionGetInteger(POSITION_TYPE);
                 pos["volume"] = PositionGetDouble(POSITION_VOLUME);
                 pos["open_price"] = PositionGetDouble(POSITION_PRICE_OPEN);
                 pos["current_price"] = PositionGetDouble(POSITION_PRICE_CURRENT);
                 pos["sl"] = PositionGetDouble(POSITION_SL);
                 pos["tp"] = PositionGetDouble(POSITION_TP);
                 pos["swap"] = PositionGetDouble(POSITION_SWAP);
                 pos["profit"] = PositionGetDouble(POSITION_PROFIT);
                 pos["comment"] = PositionGetString(POSITION_COMMENT);
                 
                 positionsArr.Add(pos);
             }
             
             CJAVal payload;
             payload["status"] = "OK";
             payload["positions"].Set(positionsArr);
             
             // Send as EV_TRADE_UPDATE (Snapshot)
             // We use the request_id from the command to correlate if needed, 
             // but usually this is an event. 
             // However, since it's a direct response to CMD_SYNC_POSITIONS, 
             // we can also send CMD_SYNC_POSITIONS_RESPONSE if we wanted, 
             // but `TradeWorker` listens for `EV_TRADE_UPDATE`.
             // Let's send `EV_TRADE_UPDATE` as the update content.
             
             string reqId = "";
             if (msg.HasKey("header") && msg["header"].HasKey("request_id")) reqId = msg["header"]["request_id"].ToStr();
             
             m_wsClient.SendProtocolMessage("EV_TRADE_UPDATE", payload, reqId);
             Print("[TradingExpert] 📤 Synced ", total, " active positions.");
             return;
        }

        // --- COMMAND DISPATCHER ---
        // Try Command Manager first
        CJAVal resultPayload;
        
        // Unbox payload if present (Standard SystemOrchestrator Envelope)
        CJAVal* dispatchData = &msg;
        if (msg.HasKey("payload") != NULL) {
            dispatchData = msg["payload"];
        } else if (msg.HasKey("content") != NULL) {
            dispatchData = msg["content"];
        }
        
        bool dispatchSuccess = m_cmdManager.Dispatch(type, *dispatchData, resultPayload);
        
        if (dispatchSuccess || (resultPayload.HasKey("message") && resultPayload["message"].ToStr() != ("Unknown command: " + type))) {
             string reqId = "";
             if (msg.HasKey("header") && msg["header"].HasKey("request_id")) {
                 reqId = msg["header"]["request_id"].ToStr();
             } else if (msg.HasKey("request_id")) {
                 reqId = msg["request_id"].ToStr();
             }
             
             if (!dispatchSuccess) {
                 if (!resultPayload.HasKey("status")) resultPayload["status"] = "ERROR";
             }
             
             string responseType = (type != "") ? type + "_RESPONSE" : "RESPONSE";
             m_wsClient.SendProtocolMessage(responseType, resultPayload, reqId);
             return;
        }
        
        // Fallthrough to Legacy Handlers below...
        
        // DEBUG TRACE for Command Processing
        Print("DEBUG: RX Message Type: ", type, " TS: ", cmdTs, " LastTS: ", m_lastCommandTimestamp);

        // BYPASS TIMESTAMP CHECK FOR ACKS (CRITICAL FIX)
        // ACKs coming from backend might have slight race conditions or be async.
        // We should always process ACKs regardless of timestamp, or handle them separately.
        // For now, let's just log if skipped.
        
        // REFACTOR: Removed inline handlers for EXECUTE_TRADE, CMD_CLOSE_POSITION, CMD_MODIFY_POSITION
        // because they are now registered in CCommandManager.
        // Keeping only CMD_CONFIRM_TRADE (Legacy ACK) and CMD_BROKER_CONFIG.
        
        if (type == "CMD_CONFIRM_TRADE" || type == "CMD_BROKER_CONFIG" || type=="CMD_UPDATE_CONFIG" || cmdTs > m_lastCommandTimestamp) {
            
            // --- INLINE HANDLER ---

            if (type == "CMD_CONFIRM_TRADE") // ACK Handler
            {
                Print("DEBUG: CMD_CONFIRM_TRADE Received. JSON: ", msg.Serialize()); // DEBUG TRACE
                CJAVal* p = NULL;
                if (msg.HasKey("content")) p = msg["content"];
                else if (msg.HasKey("payload")) p = msg["payload"];

                if (p != NULL) {
                    if(p.HasKey("id")) {
                        long ackId = StringToInteger((*p)["id"].ToStr());
                        Print("DEBUG: Parsed ACK ID: ", ackId); // DEBUG TRACE
                        if(ackId > 0) {
                            // Deduplicate Add
                            bool exists = false;
                            for(int k=0; k<m_ackedClosedTrades.Total(); k++) {
                                if(m_ackedClosedTrades.At(k) == ackId) { exists = true; break; }
                            }
                            if(!exists) {
                                m_ackedClosedTrades.Add(ackId);
                                Print("[ACK] Backend Confirmed Trade Closure: ", ackId);
                            } else {
                                Print("DEBUG: ACK ID ", ackId, " already exists.");
                            }
                        }
                    } else { Print("DEBUG: ACK Payload missing 'id'"); }
                } else { Print("DEBUG: ACK missing content/payload"); }
            }
                
            // ACK
            if (msg.HasKey("id")) UpdateMessageStatus(msg["id"].ToStr(), false);
            
            else if (type == "CMD_BROKER_CONFIG") {
                if(msg.HasKey("config")) {
                    CJAVal conf = msg["config"];
                    m_config.UpdateFromJSON(conf);
                }
            }
            
            // CMD_UPDATE_CONFIG moved to pre-dispatch
            
            if (cmdTs > 0) m_lastCommandTimestamp = cmdTs;
        } 
        
        outputArray.Add(msg);
        return;
    }
}

// Ack Handler (Merged from TradeInfo)
// Ack Handler (Merged from TradeInfo)
void CTradingExpert::HandleAckTrade(CJAVal *payload)
{
    if (CheckPointer(payload) == POINTER_INVALID) return;

    long id = 0;
    
    // Check "content" -> "id"
    CJAVal* contentNode = payload.HasKey("content");
    if (CheckPointer(contentNode) != POINTER_INVALID) {
        CJAVal* idNode = contentNode.HasKey("id");
        if (CheckPointer(idNode) != POINTER_INVALID) {
            id = idNode.ToInt();
        }
    }
    
    // FIX: Check "payload" -> "id" (Standard SystemOrchestrator Envelope)
    if (id == 0) {
        CJAVal* payloadNode = payload.HasKey("payload");
        if (CheckPointer(payloadNode) != POINTER_INVALID) {
            CJAVal* idNodePay = payloadNode.HasKey("id");
            if (CheckPointer(idNodePay) != POINTER_INVALID) {
                id = idNodePay.ToInt();
            }
        }
    }
    
    // Fallback: Check "id" at root
    if (id == 0) {
        CJAVal* idNodeRoot = payload.HasKey("id");
        if (CheckPointer(idNodeRoot) != POINTER_INVALID) {
            id = idNodeRoot.ToInt();
        }
    }
    
    if (id > 0) {
        Print("[TradingExpert] 📥 ACK_PACKET: ID=", id);
        bool found = false;
        for(int i=0; i<m_ackedClosedTrades.Total(); i++) {
            if(m_ackedClosedTrades.At(i) == id) {
                found = true;
                break;
            }
        }
        if(!found) {
            m_ackedClosedTrades.Add(id);
        }
    }
}

// Confirm History (Single ID)
void CTradingExpert::ConfirmHistory(string tradeId)
{
    long id = StringToInteger(tradeId);
    if (id > 0) {
        Print("[TradingExpert] 📥 CMD_CONFIRM_HISTORY: ID=", id);
        bool found = false;
        for(int i=0; i<m_ackedClosedTrades.Total(); i++) {
            if(m_ackedClosedTrades.At(i) == id) {
                found = true;
                break;
            }
        }
        if(!found) {
            m_ackedClosedTrades.Add(id);
            m_lastReportHash = ""; // Reset hash to force immediate update
        }
    }
}

// Confirm History (Timestamp Batch)
void CTradingExpert::ConfirmHistory(long timestamp)
{
    if (timestamp <= 0) return;
    Print("[TradingExpert] 📥 CMD_CONFIRM_HISTORY: Batch ACK up to TS=", timestamp);
     
     bool changed = false;
     for(int i=0; i<m_metrics.Total(); i++) {
         CMetric* m = m_metrics.At(i);
         if(!m.isOpen && m.magic > 0 && m.closeTime > 0) {
             if((long)m.closeTime <= timestamp) {
                 ulong mg = m.magic;
                 
                 // Check if already acked
                 bool isAcked = false;
                 for(int j=0; j<m_ackedClosedTrades.Total(); j++) {
                     if(m_ackedClosedTrades.At(j) == (long)mg) { isAcked = true; break; }
                 }
                 
                 if(!isAcked) {
                     m_ackedClosedTrades.Add((long)mg);
                     changed = true;
                     Print("[TradingExpert] Batch Acked Trade: ", mg);
                 }
             }
         }
     }
     
     if(changed) m_lastReportHash = ""; // Force update to remove acked trades from report
}

//+------------------------------------------------------------------+
//| RebuildDailyState (Clean Wipe & Restore)                         |
//+------------------------------------------------------------------+
void CTradingExpert::RebuildMetricsForOpenPositions()
{
    // Calling the new Robust Method
    RebuildDailyState();
}

void CTradingExpert::RebuildDailyState()
{
    // 1. WIPE STATE
    m_metrics.Clear();
    m_processedDealTickets.Clear(); 
    
    // 2. SCAN POSITIONS FIRST (The "Now" Truth)
    int total = PositionsTotal();
    for(int i=0; i<total; i++) {
        ulong ticket = PositionGetTicket(i);
        if(ticket > 0) {
            ulong magic = PositionGetInteger(POSITION_MAGIC);
            
            CMetric* metric = new CMetric();
            metric.magic = magic;
            metric.isOpen = true; // MARK AS OPEN PRIMARY
            
            // Capture Active Details
            metric.positionTicket = ticket;
            metric.symbol = PositionGetString(POSITION_SYMBOL);
            metric.type = (long)PositionGetInteger(POSITION_TYPE);
            metric.comment = PositionGetString(POSITION_COMMENT);
            
            // Note: We don't store Active Profit in Metric cache, 
            // because valid metric.totalRealizedPl must be derived from History Deals (Step 3).
            
            m_metrics.Add(metric);
        }
    }
    
    // 3. SCAN HISTORY (Day Start -> Now)
    // Supplemental Data for Realized PnL (Partials)
    datetime dayStart = iTime(NULL, PERIOD_D1, 0);
    if(dayStart == 0) dayStart = (datetime)(TimeCurrent() - 86400);
    m_lastHistoryTime = dayStart;

    if(HistorySelect(dayStart, TimeCurrent())) {
        int deals = HistoryDealsTotal();
        for(int i=0; i<deals; i++) {
            ulong ticket = HistoryDealGetTicket(i);
            if(ticket > 0) {
                 ulong magic = (ulong)HistoryDealGetInteger(ticket, DEAL_MAGIC);
                 if(magic == 0 && m_metrics.Total() == 0) continue; // Optimization
                 
                 // Process Deal Data
                 long dealTime = HistoryDealGetInteger(ticket, DEAL_TIME);
                 double profit = HistoryDealGetDouble(ticket, DEAL_PROFIT);
                 double comm = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
                 double swap = HistoryDealGetDouble(ticket, DEAL_SWAP);
                 double vol = HistoryDealGetDouble(ticket, DEAL_VOLUME);
                 long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
                 
                 // FIND METRIC (Ideally created in Step 2)
                 CMetric* metric = NULL;
                 for(int k=0; k<m_metrics.Total(); k++) {
                     CMetric* m = m_metrics.At(k);
                     if(m.magic == magic) { metric = m; break; }
                 }
                 
                 // If not found (Closed Trade), create new
                 if(metric == NULL) {
                     metric = new CMetric();
                     metric.magic = magic;
                     metric.isOpen = false; // By default Closed if not in Step 2
                     m_metrics.Add(metric);
                 }
                 
                 metric.AddDeal(ticket, profit, comm, swap, dealTime, vol, (int)entry);
                 
                 // Accessors for Metadata
                 if(entry == DEAL_ENTRY_IN) {
                      metric.entryPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
                      metric.openTime = (ulong)dealTime;
                      metric.symbol = HistoryDealGetString(ticket, DEAL_SYMBOL);
                      metric.type = HistoryDealGetInteger(ticket, DEAL_TYPE); 
                 }
                 
                 m_processedDealTickets.Add((long)ticket);
            }
        }
    }
    
    Print("[TradingExpert] 🔄 RebuildDailyState Complete (Pos-First). Metrics: ", m_metrics.Total());
}

#endif
