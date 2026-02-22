//+------------------------------------------------------------------+
//|                                                      TickSpy.mq5 |
//|                                  Antigravity Agentic Integration |
//|                                       https://antigravity.agent  |
//+------------------------------------------------------------------+
#property copyright "Antigravity Agentic Integration"
#property link      "https://antigravity.agent"
#property version   "11.0"
#property indicator_chart_window
#property indicator_buffers 0
#property indicator_plots   0

#include <Expert\UBCP_Structs.mqh>

// --- Config ---
// --- Config ---
#define PIPE_PREFIX "\\\\.\\pipe\\AOS_P_"
#define HISTORY_DEPTH 500

// --- Inputs ---
input string InpInternalSymbol = ""; // Internal Symbol (e.g. US100) used for Pipe & Backend Identity

// --- Strict State Machine ---
enum ENUM_PIPE_STATE {
    STATE_OFFLINE,      // No Pipe Handle. Retry loop.
    STATE_HANDSHAKE,    // Pipe Open. Waiting for Server Time.
    STATE_SYNCING,      // Received Time. Pushing History Gap.
    STATE_LIVE          // Sync Complete. Processing Control Packets / Live Ticks.
};

// --- State Variables ---
int             g_hPipe         = INVALID_HANDLE;
string          g_PipeName      = "";
string          g_IdentitySymbol = ""; // The symbol we identify as (Internal if set, else Broker)
ENUM_PIPE_STATE g_PipeState     = STATE_OFFLINE;
uint            g_LastErrorCode = 0; // To prevent log spanning 5022

// Hybrid Push/Pull State
bool     g_LiveStreamActive[17]; // Matches g_Timeframes size (17 TFs)
datetime g_LastBarTime[17];

// TFs to Monitor
// EXPANDED (Task 0153): Support all standard Timeframes for Full-Spectrum Sync
ENUM_TIMEFRAMES g_Timeframes[] = {
    PERIOD_M1, PERIOD_M2, PERIOD_M3, PERIOD_M5, PERIOD_M10, PERIOD_M15, PERIOD_M30,
    PERIOD_H1, PERIOD_H2, PERIOD_H3, PERIOD_H4, PERIOD_H6, PERIOD_H8, PERIOD_H12,
    PERIOD_D1, PERIOD_W1, PERIOD_MN1
};

//+------------------------------------------------------------------+
//| Custom indicator initialization function                         |
//+------------------------------------------------------------------+
int OnInit()
{
   // IDENTITY LOGIC
   if (InpInternalSymbol != "") {
       g_IdentitySymbol = InpInternalSymbol;
       Print("[TickSpy] Identity Override: ", _Symbol, " -> ", g_IdentitySymbol);
   } else {
       g_IdentitySymbol = _Symbol;
   }

   // PIPE NAMING: AOS_P_US100 (Internal)
   g_PipeName = PIPE_PREFIX + g_IdentitySymbol; 
   Print("[TickSpy] Initializing Decentralized Pipe: ", g_PipeName);
   
   EventSetMillisecondTimer(200); // 5Hz Tick Loop
   
   // Init State
   g_PipeState = STATE_OFFLINE;
   ArrayInitialize(g_LiveStreamActive, false);
   ArrayInitialize(g_LastBarTime, 0);
   
   for(int i=0; i<ArraySize(g_Timeframes); i++) {
       g_LastBarTime[i] = iTime(_Symbol, g_Timeframes[i], 0);
   }
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| OpenPipe (Transition to HANDSHAKE)                               |
//+------------------------------------------------------------------+
void OpenPipe()
{
    if (g_hPipe != INVALID_HANDLE) return;
    
    // Attempt Open
    // FIX: Add FILE_SHARE_READ to allow concurrent operations / prevent locking
    g_hPipe = FileOpen(g_PipeName, FILE_READ|FILE_WRITE|FILE_BIN|FILE_SHARE_READ);
    
    if (g_hPipe != INVALID_HANDLE) {
        PrintFormat("[TickSpy] 🟢 RECONNECTED: Pipe opened successfully (%s).", g_PipeName);
        g_PipeState = STATE_HANDSHAKE;
        g_LastErrorCode = 0; // Reset error tracker
        
        // Log State Transition
        Print("[TickSpy] 📥 HANDSHAKE: Waiting for last timestamp from Worker...");
    } else {
        // Handle Error Codes logic could be here, but OnTimer handles backoff
        int err = GetLastError();
        if (err != g_LastErrorCode) {
             if (err == 5022) {
                 PrintFormat("[TickSpy] ⏳ Pipe not ready (5022). Retrying silently...");
             } else {
                 PrintFormat("[TickSpy] ❌ OpenPipe Failed. Err=%d", err);
             }
             g_LastErrorCode = err;
        }
    }
}

//+------------------------------------------------------------------+
//| ClosePipe (Transition to OFFLINE)                                |
//+------------------------------------------------------------------+
void ClosePipe() 
{
    if (g_hPipe != INVALID_HANDLE) {
        FileClose(g_hPipe);
        g_hPipe = INVALID_HANDLE;
        Print("[TickSpy] ⚠️ CONNECTION LOST: Handle closed.");
    }
    
    // Always force state reset
    if (g_PipeState != STATE_OFFLINE) {
        g_PipeState = STATE_OFFLINE;
        // Print("[TickSpy] State -> OFFLINE"); 
    }
}

//+------------------------------------------------------------------+
//| OnDeinit                                                         |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    ClosePipe(); 
    EventKillTimer();
}

//+------------------------------------------------------------------+
//| OnTimer (State Machine Driver)                                   |
//+------------------------------------------------------------------+
void OnTimer()
{
    switch(g_PipeState) 
    {
        case STATE_OFFLINE:
        {
            // Retry Connection
            // Backoff logic for 5022 is implicitly handled by OS/latency or we can add a counter.
            // For now, OpenPipe checks error codes to avoid spam.
            OpenPipe();
            return;
        }
        
        case STATE_HANDSHAKE:
        {
            // Wait for 8 bytes (Int64 Timestamp)
            long size = FileSize(g_hPipe);
            if (size >= 8) {
                 long serverMaxTime = FileReadLong(g_hPipe);
                 
                 PrintFormat("[TickSpy] 🚀 RESYNCING: Sending history since %s (%I64d)", 
                             TimeToString((datetime)(serverMaxTime/1000)), serverMaxTime);
                 
                 // Transition to SYNCING
                 g_PipeState = STATE_SYNCING;
                 
                 // Perform Sync Immediately
                 datetime syncTime = (datetime)(serverMaxTime / 1000); 
                 PushHistoryAll(syncTime);
                 
                 // Transition to LIVE
                 g_PipeState = STATE_LIVE;
                 Print("[TickSpy] ✅ SYNC COMPLETE: Transitioned to Live-Streaming.");
                 PrintFormat("[TickSpy] ⚡ Live Stream Started for Symbol %s", _Symbol);
            }
            return;
        }
        
        case STATE_SYNCING:
        {
            // Should be handled synchronously inside HANDSHAKE->SYNCING block ideally, 
            // but if we made it async, this state would handle incremental pushes.
            // Current implementation does PushHistoryAll synchronously then moves to LIVE.
            // So we might not hit this case often unless PushHistoryAll yields.
            g_PipeState = STATE_LIVE; 
            return;
        }
        
        case STATE_LIVE:
        {
            // 1. SEND LIVE TICK (If available)
            MqlTick lastTick;
            if (SymbolInfoTick(_Symbol, lastTick)) {
                 // Throttle? Or Send All? 
                 // For now, simple logic: Send ONLY if new? 
                 // Or just trust the Node side to dedupe?
                 // Let's implement a 'LastSentTick' check to avoid spamming the pipe with identical ticks?
                 // But OnTimer runs at 200ms. OnTick runs at incoming tick.
                 // Wait, we are in OnTimer. 
                 // We should send Live Ticks in OnTick()!
                 // But we can check for Control Packets here.
            }
            
            // 2. READ CONTROL PACKETS
            // Expect Header (24) + Body (4) = 28 Bytes
            
            while (FileSize(g_hPipe) >= 28) {
                // Read Header
                UBCPHeader header;
                if (FileReadStruct(g_hPipe, header) <= 0) {
                     ClosePipe(); // Read Error -> OFFLINE
                     return;
                }
                
                // Validate Magic
                if (header.magic != 0xAF || header.type != 4) {
                     PrintFormat("[TickSpy] ⚠️ Protocol Mismatch/Corrupt: Magic=%02X Type=%d", header.magic, header.type);
                     ClosePipe();
                     return;
                }
                
                // Read Body
                UBCPControl ctrl;
                if (FileReadStruct(g_hPipe, ctrl) <= 0) {
                     Print("[TickSpy] ⚠️ Packet Fragmented (Body Missing). Resetting Pipe.");
                     ClosePipe();
                     return;
                }
                
                ProcessControl(header, ctrl);
            }
            return;
        }
    }
}

//+------------------------------------------------------------------+
//| Helper: Process Control                                          |
//+------------------------------------------------------------------+
void ProcessControl(const UBCPHeader &header, const UBCPControl &ctrl) {
   // Action: 1=START, 0=STOP
   // TF: header.tf_sec
   
   int tfIdx = -1;
   for(int i=0; i<ArraySize(g_Timeframes); i++) {
       if ((uint)PeriodSeconds(g_Timeframes[i]) == header.tf_sec) {
           tfIdx = i;
           break;
       }
   }
   
   if (tfIdx >= 0) {
       bool active = (ctrl.action == 1);
       bool wasActive = g_LiveStreamActive[tfIdx];
       g_LiveStreamActive[tfIdx] = active;
       
       if (active) {
           PrintFormat("[TickSpy] Received START_LIVE for %s (TF=%d). Streaming enabled.", 
                       EnumToString(g_Timeframes[tfIdx]), header.tf_sec);
           
           // CRITICAL FIX (Task 0152): If we are activating, push latest history!
           // This fills the gap for Timeframes like H4 that don't tick often.
           // Only push if we weren't already active? Or always to be safe?
           // Always pushing ensures the gap is filled immediately on connect.
           // Use '0' to push ALL history (up to Depth) or just recent?
           // Let's push Depth to be safe.
           PushHistoryTF(g_Timeframes[tfIdx], 0);
           
       } else {
           PrintFormat("[TickSpy] Received STOP_LIVE for %s (TF=%d). Streaming disabled.", 
                       EnumToString(g_Timeframes[tfIdx]), header.tf_sec);
       }
   } else {
       Print("[TickSpy] ⚠️ Control Packet for Unknown TF: ", header.tf_sec);
   }
}

//+------------------------------------------------------------------+
//| Helper: Push Candle for TF                                       |
//+------------------------------------------------------------------+
void PushCandle(ENUM_TIMEFRAMES tf)
{
   if (g_hPipe == INVALID_HANDLE) return;

   // 1. Header
   UBCPHeader header;
   header.magic = 0xAF;
   header.type = 1; // Live Tick Update
   header.count = 1;
   StringToCharArray(g_IdentitySymbol, header.symbol, 0, 16);
   header.tf_sec = (uint)PeriodSeconds(tf);
   
   // 2. Data
   long   time = (long)iTime(_Symbol, tf, 0);
   double open = iOpen(_Symbol, tf, 0);
   double high = iHigh(_Symbol, tf, 0);
   double low  = iLow(_Symbol, tf, 0);
   double close= iClose(_Symbol, tf, 0);
   long   vol  = iTickVolume(_Symbol, tf, 0);
   
   UBCPCandle candle;
   candle.time = time;
   candle.open = open;
   candle.high = high;
   candle.low = low;
   candle.close = close;
   candle.volume = vol;
   
   // 3. Live Ext
   MqlTick tick;
   SymbolInfoTick(_Symbol, tick);
   
   UBCPLive live;
   live.bid = tick.bid;
   live.ask = tick.ask;
   
   if (FileWriteStruct(g_hPipe, header) <= 0 ||
       FileWriteStruct(g_hPipe, candle) <= 0 ||
       FileWriteStruct(g_hPipe, live)   <= 0) 
   {
       Print("[TickSpy] ❌ Write Failed (PushCandle). Closing Pipe.");
       ClosePipe();
   }
}

//+------------------------------------------------------------------+
//| PushHistoryAll                                                   |
//+------------------------------------------------------------------+
void PushHistoryAll(datetime afterTime)
{
   if (g_hPipe == INVALID_HANDLE) return;
   
   Print("[TickSpy] 🚀 Pushing History for ALL TFs > ", TimeToString(afterTime));
   
   for(int i=0; i<ArraySize(g_Timeframes); i++) {
       PushHistoryTF(g_Timeframes[i], afterTime);
   }
   
   // Flush once
   FileFlush(g_hPipe);
}

void PushHistoryTF(ENUM_TIMEFRAMES tf, datetime afterTime)
{
    MqlRates rates[];
    ArraySetAsSeries(rates, false); // Oldest first
    
    // FETCH LOGIC
    // If afterTime == 0, fetch all (HISTORY_DEPTH).
    // If afterTime > 0, fetch from there.
    
    int copied = 0;
    
    if (afterTime == 0) {
        copied = CopyRates(_Symbol, tf, 0, HISTORY_DEPTH, rates);
    } else {
        copied = CopyRates(_Symbol, tf, afterTime + 1, TimeCurrent(), rates); // +1 second to avoid dupe
    }
    
    if (copied <= 0) return;
    
    // FILTERING (Double Check)
    // CopyRates(time) handles it, but let's be safe.
    
    // EXCLUDE Current Forming Candle from HISTORY packet (It goes via Live stream)
    // Logic: The LAST candle in array might be the CURRENT (open) one.
    // Check time of last candle.
    long currentOpenTime = (long)TimeCurrent(); 
    long periodSec = PeriodSeconds(tf);
    currentOpenTime = currentOpenTime - (currentOpenTime % periodSec);
    
    // We only send COMPLETED candles via history (Type 2).
    // Filter logic update:
    
    int sendingCount = 0;
    int endIndex = copied;
    
    // Check last element
    if (rates[copied-1].time >= currentOpenTime) {
        endIndex = copied - 1; // Exclude open candle
    }
    
    sendingCount = endIndex;
    
    if (sendingCount <= 0) return;
    
    UBCPHeader header;
    header.magic = 0xAF;
    header.type = 2; // History
    header.count = (ushort)sendingCount;
    StringToCharArray(g_IdentitySymbol, header.symbol, 0, 16);
    header.tf_sec = (uint)PeriodSeconds(tf);
    
    if (FileWriteStruct(g_hPipe, header) <= 0) { ClosePipe(); return; }
    
    for(int k=0; k<endIndex; k++) {
        UBCPCandle c;
        c.time = (long)rates[k].time;
        // ... (Assign) ...
        c.open = rates[k].open;
        c.high = rates[k].high;
        c.low = rates[k].low;
        c.close = rates[k].close;
        c.volume = (long)rates[k].tick_volume;
        
        if (FileWriteStruct(g_hPipe, c) <= 0) {
            Print("[TickSpy] ❌ Write Failed (PushHistoryTF). Closing Pipe.");
            ClosePipe();
            return;
        }
    }
}

//+------------------------------------------------------------------+
//| OnCalculate                                                      |
//+------------------------------------------------------------------+
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
   if (g_hPipe == INVALID_HANDLE) return(rates_total);
   
   // PUSH UPDATES FOR ALL RELEVANT TIMEFRAMES
   // Hybrid Model: 
   // 1. ALWAYS push closed candles (History Type 2)
   // 2. CONDITIONALLY push live candles (Live Type 1)
   

    // --- Optimized New Bar Logic (Background Sync) ---
    CheckForNewBar();

    // B. ON-DEMAND LIVE STREAM
    for(int i=0; i<ArraySize(g_Timeframes); i++) {
        if (g_LiveStreamActive[i]) {
            PushCandle(g_Timeframes[i]); // Sends Type 1 (Live) for current bar
        }
    }
   
   FileFlush(g_hPipe);
   
   return(rates_total);
}

//+------------------------------------------------------------------+
//| CheckForNewBar (Efficient Background Sync)                       |
//+------------------------------------------------------------------+
void CheckForNewBar() {
   for(int i=0; i<ArraySize(g_Timeframes); i++) {
      ENUM_TIMEFRAMES tf = g_Timeframes[i];
      datetime currentTime = iTime(_Symbol, tf, 0);

      // Startup Initialization
      if(g_LastBarTime[i] == 0) {
         g_LastBarTime[i] = currentTime;
         continue;
      }

      // New Bar Detection
      if(currentTime > g_LastBarTime[i]) {
         PrintFormat("[TickSpy] [%s] 🏁 Bar Closed on %s. Pushing to DB.", _Symbol, EnumToString(tf));
         
         // Push the COMPLETED bar (One specific bar)
         PushCompletedBar(tf, g_LastBarTime[i]);
         
         // Update timestamp
         g_LastBarTime[i] = currentTime;
      }
   }
}

//+------------------------------------------------------------------+
//| PushCompletedBar (Efficient Single-Bar Push)                     |
//+------------------------------------------------------------------+
void PushCompletedBar(ENUM_TIMEFRAMES tf, datetime barTime)
{
     if (g_hPipe == INVALID_HANDLE) return;
     
     MqlRates rates[];
     // Copy EXACTLY one bar at the specific time
     int copied = CopyRates(_Symbol, tf, barTime, 1, rates);
     
     if (copied != 1) {
         PrintFormat("[TickSpy] ⚠️ Failed to copy completed bar for %s (Time=%s)", EnumToString(tf), TimeToString(barTime));
         return;
     }
     
     // Construct Header
     UBCPHeader header;
     header.magic = 0xAF;
     header.type = 2; // History
     header.count = 1;
     StringToCharArray(_Symbol, header.symbol, 0, 16);
     header.tf_sec = (uint)PeriodSeconds(tf);
     
     // Construct Candle
     UBCPCandle c;
     c.time = (long)rates[0].time;
     c.open = rates[0].open;
     c.high = rates[0].high;
     c.low = rates[0].low;
     c.close = rates[0].close;
     c.volume = (long)rates[0].tick_volume;

     if (FileWriteStruct(g_hPipe, header) <= 0 || FileWriteStruct(g_hPipe, c) <= 0) {
         Print("[TickSpy] ❌ Write Failed (PushCompletedBar). Closing Pipe.");
         ClosePipe();
     }
}
