//+------------------------------------------------------------------+
//|                                           TickSpyService.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property strict

#ifndef TICKSPY_SERVICE_MQH
#define TICKSPY_SERVICE_MQH

#include <JAson.mqh>
#include <Expert\WebSocketClient.mqh>

class CTickSpyService
{
private:
   CWebSocketClient* m_wsClient;
   string            m_identitySymbol;
   string            m_botId;
   
   struct PendingDataRequest {
       string timeframe;
       int count;
       datetime requestTime;
       int retries;
   };

   // State
   string            m_subscribedTFs[];
   int               m_subscribedCount;
   
   // Always-On Bar Monitoring
   string            m_allTimeframes[]; 
   datetime          m_allLastBarTimes[];
   int               m_allTFsCount;
   
   PendingDataRequest m_pendingRequests[];
   int               m_pendingCount;
   
public:
   CTickSpyService() 
   { 
      m_wsClient = NULL; 
      m_subscribedCount = 0;
      m_pendingCount = 0;
      m_allTFsCount = 0;
   }
   
   void Init(CWebSocketClient* ws, string botId, string symbol)
   {
      m_wsClient = ws;
      m_botId = botId;
      m_identitySymbol = symbol;
      PrintFormat("[TickSpyService::Init] Initialized Service. BotID: '%s', Symbol: '%s'", m_botId, m_identitySymbol);

      // Initialize Always-On Timeframes (Backend compatible list)
      string tfs[] = {"M1","M2","M3","M5","M10","M15","M30","H1","H2","H3","H4","H6","H8","H12","D1","W1","MN1"};
      m_allTFsCount = ArraySize(tfs);
      ArrayResize(m_allTimeframes, m_allTFsCount);
      ArrayResize(m_allLastBarTimes, m_allTFsCount);
      
      for(int i=0; i<m_allTFsCount; i++) {
          m_allTimeframes[i] = tfs[i];
          m_allLastBarTimes[i] = 0; // Will be set on first check
      }
      PrintFormat("[TickSpyService] ⚙️ configured %d Always-On Timeframes for Bar Monitoring.", m_allTFsCount);
   }
   
   // --- Seamless Sync Helper ---
   void UpdateLastBarTime(string tf, datetime time) {
       for(int i=0; i<m_allTFsCount; i++) {
           if(m_allTimeframes[i] == tf) {
               if(time > m_allLastBarTimes[i]) {
                   m_allLastBarTimes[i] = time;
                   PrintFormat("[TickSpyService] 🔄 Sync State Updated: %s -> %s (Seamless Handoff)", tf, TimeToString(time));
               }
               break;
           }
       }
   }
   
   // --- Command Handlers ---
   
   bool ProcessStartSynchronizedUpdate(CJAVal *payload, CJAVal &response)
   {
       if (payload == NULL) return false;
       
       string tf = "";
       if (payload.HasKey("timeframe")) tf = (*payload)["timeframe"].ToStr();
       
       string mode = "";
       if (payload.HasKey("mode")) mode = (*payload)["mode"].ToStr();
       
       long lastTime = 0;
       if (payload.HasKey("lastTime")) lastTime = (*payload)["lastTime"].ToInt();
       
       int count = 1000;
       if (payload.HasKey("count")) count = (int)(*payload)["count"].ToInt();
       if (count <= 0) count = 1000;
       
       ENUM_TIMEFRAMES period = GetTimeframe(tf);
       
       PrintFormat("[TickSpyService] 🔄 CMD_START_SYNCHRONIZED_UPDATE (%s). TF: %s, LastTime: %I64d, Count: %d", mode, tf, lastTime, count);
       
       MqlRates rates[];
       int copied = 0;
       
       if (mode == "INITIAL_FILL") {
           // Fetch last N closed bars (Start from index 1)
           copied = CopyRates(_Symbol, period, 1, count, rates);
       } else if (mode == "GAP_FILL") {
           // Fetch from lastTime+1 to Bar[1]
           datetime start = (datetime)lastTime + 1;
           datetime stop = iTime(_Symbol, period, 1);
           
           if (stop < start) {
                PrintFormat("[TickSpyService] Gap Fill Empty: Stop (%s) < Start (%s). Already up-to-date.", TimeToString(stop), TimeToString(start));
                UpdateLastBarTime(tf, stop);
                response["status"] = "OK";
                response["data"].Set(new CJAVal()); // Empty array
                response["timeframe"] = tf; // CRITICAL for Worker Correlation
                return true;
           }
           copied = CopyRates(_Symbol, period, start, stop, rates);
       }
       
        if (copied <= 0) {
            int err = GetLastError();
            PrintFormat("[TickSpyService] ❌ CopyRates Failed or Empty (Count: %d, Error: %d). Mode: %s.", copied, err, mode);
            
            response["status"] = "ERROR";
            response["message"] = (copied == 0) ? "No Data (0 bars)" : "CopyRates Error " + (string)err;
            response["timeframe"] = tf; // CRITICAL for Worker Correlation
            return true; // Command executed, but result is error
        }
        
        // Populate Response Data
        CJAVal data;
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
        response["content"].Set(data);
        response["status"] = "OK";
        response["timeframe"] = tf; // CRITICAL for Worker Correlation
        
        PrintFormat("[TickSpyService] ✅ Prepared Response (%d bars). First Bar: Time=%I64d.", copied, rates[0].time);
            
        // CRITICAL: Update Pointer to the LAST SENT BAR (Time[1])
        UpdateLastBarTime(tf, rates[copied-1].time); // rates is sorted by time ascending
       
       return true;
   }

   bool ProcessGetCurrentBar(CJAVal *payload, CJAVal &response)
   {
       if (payload == NULL) return false;
       
       string tf = "";
       if (payload.HasKey("timeframe")) tf = (*payload)["timeframe"].ToStr();
       
       ENUM_TIMEFRAMES period = GetTimeframe(tf);
       
       MqlRates rates[];
       if (CopyRates(_Symbol, period, 0, 1, rates) == 1) {
           CJAVal data;
           data["time"] = (long)rates[0].time;
           data["open"] = rates[0].open;
           data["high"] = rates[0].high;
           data["low"] = rates[0].low;
           data["close"] = rates[0].close;
           data["volume"] = (long)rates[0].tick_volume;
           data["timeframe"] = tf;
           data["symbol"] = m_identitySymbol;
           
           response["content"].Set(data);
           response["status"] = "OK";
           
           PrintFormat("[TickSpyService] ✅ CMD_GET_CURRENT_BAR: Sent forming bar %s for %s", TimeToString(rates[0].time), tf);
           return true;
       }
       
       response["status"] = "ERROR";
       response["message"] = "CopyRates failed to get current bar";
       return true;
   }

   // SendSyncComplete removed (Implicit in Response)

   void ProcessSubscribeCommand(CJAVal *payload, bool subscribe, CJAVal &response)
   {
       // ... existing logic ...
       if (payload == NULL) return;
       string tf = "";
       if (payload.HasKey("timeframe")) tf = (*payload)["timeframe"].ToStr();
       // ...
       
       // Re-implementing logic to ensure context is correct
       int index = -1;
       for(int i=0; i<m_subscribedCount; i++) {
           if (m_subscribedTFs[i] == tf) { index = i; break; }
       }
       
       if (subscribe) {
           if (index == -1) {
               m_subscribedCount++;
               ArrayResize(m_subscribedTFs, m_subscribedCount);
               m_subscribedTFs[m_subscribedCount-1] = tf;
               PrintFormat("[TickSpyService] Added subscription for %s. Total: %d", tf, m_subscribedCount);
           }
           
           // Fetch and inject forming candle
           ENUM_TIMEFRAMES period = GetTimeframe(tf);
           MqlRates rates[];
           if (CopyRates(_Symbol, period, 0, 1, rates) == 1) {
               CJAVal candle;
               candle["time"] = (long)rates[0].time;
               candle["open"] = rates[0].open;
               candle["high"] = rates[0].high;
               candle["low"] = rates[0].low;
               candle["close"] = rates[0].close;
               candle["volume"] = (long)rates[0].tick_volume;
               
               response["candle"].Set(candle);
               PrintFormat("[TickSpyService] ✅ CMD_SUBSCRIBE_TICKS: Appended forming bar %s for %s", TimeToString(rates[0].time), tf);
           } else {
               PrintFormat("[TickSpyService] ⚠️ CMD_SUBSCRIBE_TICKS: Failed to get forming bar for %s", tf);
           }
       } else {
           if (index != -1) {
               for(int i=index; i<m_subscribedCount-1; i++) m_subscribedTFs[i] = m_subscribedTFs[i+1];
               m_subscribedCount--;
               ArrayResize(m_subscribedTFs, m_subscribedCount);
               PrintFormat("[TickSpyService] Removed subscription for %s. Total: %d", tf, m_subscribedCount);
           }
       }
       response["status"] = "OK";
   }

    void SendBarDataForTF(ENUM_TIMEFRAMES period, int index) {
        MqlRates rates[];
        if (CopyRates(_Symbol, period, index, 1, rates) == 1) {
            string tf = GetTimeframeString(period);
            
            // PROTOCOL V3 (Strict):
            // Index 0 = EV_BAR_UPDATE (Forming)
            // Index 1+ = EV_BAR_CLOSED (Persistable)
            string type = (index == 0) ? "EV_BAR_UPDATE" : "EV_BAR_CLOSED";
            

            
            CJAVal data;
            data["symbol"] = m_identitySymbol;
            data["timeframe"] = tf;
            
            CJAVal candle;
            candle["time"] = (long)rates[0].time;
            candle["open"] = rates[0].open;
            candle["high"] = rates[0].high;
            candle["low"] = rates[0].low;
            candle["close"] = rates[0].close;
            candle["volume"] = (long)rates[0].tick_volume;
            
            data["candle"].Set(candle);
            
            // Send via Strict Protocol Helper (Header is auto-generated)
            m_wsClient.SendProtocolMessage(type, data);
        }
    }
    void CheckNewBar() 
    {
        // Monitor ALL timeframes for Closed Bars (Persistence)
        for(int i=0; i<m_allTFsCount; i++) {
            ENUM_TIMEFRAMES period = GetTimeframe(m_allTimeframes[i]);
            datetime time = iTime(_Symbol, period, 0);
            
            if (time > m_allLastBarTimes[i]) {
                // New Bar Detected -> Previous Bar Closed
                if (m_allLastBarTimes[i] != 0) { 
                    SendBarDataForTF(period, 1); // Send CLOSED Bar (Index 1)
                }
                m_allLastBarTimes[i] = time;
                // Index 0 (Open) is NOT sent here. Live updates are handled by StreamSubscribedData.
            }
        }
    }

    void StreamSubscribedData() 
    {
        // Stream LIVE updates (Index 0) for all subscribed timeframes
        for(int i=0; i<m_subscribedCount; i++) {
            ENUM_TIMEFRAMES period = GetTimeframe(m_subscribedTFs[i]);
            // Send Index 0 (Forming Bar Update)
            SendBarDataForTF(period, 0); 
        }
    }

    // --- Helper Methods ---
    
    ENUM_TIMEFRAMES GetTimeframe(string tf)
    {
        if(tf == "M1") return PERIOD_M1;
        if(tf == "M2") return PERIOD_M2;
        if(tf == "M3") return PERIOD_M3;
        if(tf == "M4") return PERIOD_M4;
        if(tf == "M5") return PERIOD_M5;
        if(tf == "M10") return PERIOD_M10;
        if(tf == "M12") return PERIOD_M12;
        if(tf == "M15") return PERIOD_M15;
        if(tf == "M20") return PERIOD_M20;
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

    string GetTimeframeString(ENUM_TIMEFRAMES tf)
    {
        string s = EnumToString(tf);
        if(StringFind(s, "PERIOD_") == 0) return StringSubstr(s, 7);
        return s;
    }
};

#endif
