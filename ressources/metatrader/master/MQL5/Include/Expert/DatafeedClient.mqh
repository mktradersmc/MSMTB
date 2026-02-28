//+------------------------------------------------------------------+
//|                                              DatafeedClient.mqh  |
//|                                  Copyright 2026, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property link      "https://www.mql5.com"
#property strict

#ifndef DATAFEED_CLIENT_MQH
#define DATAFEED_CLIENT_MQH

#include "..\JAson.mqh"
#include <Files/FileTxt.mqh>
#include "ConfigLoader.mqh"

// Pipe Names
#define PIPE_DISCOVERY_NAME "\\\\.\\pipe\\MT5_Node_Commands" // Formerly Bridge, now Commands (Discovery)
#define PIPE_HISTORY_NAME "\\\\.\\pipe\\MT5_Node_History"
#define PIPE_HEARTBEAT_NAME "\\\\.\\pipe\\MT5_Node_Heartbeat"

enum ConnectionState {
    STATE_DISCONNECTED,
    STATE_REGISTERING,
    STATE_CONNECTING,
    STATE_CONNECTED
};

// --- COMMAND HANDLER INTERFACE ---
class IDatafeedCommandHandler
{
public:
   virtual void HandleCommand(string type, CJAVal &msg) = 0;
};

class CDatafeedClient
{
private:
    string m_botId;
    string m_symbol;
    long   m_lastTimestamp;
    int    m_pollIntervalSeconds;
    datetime m_lastPollTime;
    datetime m_lastHeartbeatTime;
    
    // Communication
    string m_privatePipeName; 
    int    m_hCommandPipe; // Persistent Handle
    string m_pipeHeartbeatName;
    ConnectionState m_state;
    
    long   m_lastCommandTimestamp;
    IDatafeedCommandHandler* m_commandHandler;
    string m_timezoneSignature;
    
    // void ParseConfigLine(string line); // REMOVED (Use ConfigLoader)
    bool SendToPipe(string message, string &response, string pipeName, bool waitForResponse=true);
    bool SendToPipe(string message, string &response, bool waitForResponse=true);
    bool SendToPipeNamed(string message, string pipeName, bool waitForResponse=true);
    bool SendToPipe(string message, bool waitForResponse=true);
    bool UpdateMessageStatus(string messageId, bool isActive);
    void ProcessIncomingMessages(CJAVal &messages);
    void ProcessSingleMessage(CJAVal &msg);
    
    // Connection Logic
    void CheckConnection();
    void CheckCommandPipe(); // Maintain persistent connection
    bool RegisterBot();

    string m_rxBuffer; // Persistent Read Buffer for Fragmented Packets

    int ReadCommandPipe(CJAVal &messagesArray); // Non-blocking read (Populate Buffer)
    int ReadCommandPipe();                      // Non-blocking read (Process Internally)

public:
    CDatafeedClient(string pipeName); // Constructor signature kept but pipeName ignored for main comms
    ~CDatafeedClient();
    
    bool LoadConfig(string configFile="bot_properties.txt");
    void SetCommandHandler(IDatafeedCommandHandler* handler) { m_commandHandler = handler; }
    void SetTimezoneSignature(string sig) { m_timezoneSignature = sig; }
    string GetBotId() { return m_botId; }
    
    bool SendMessage(string type, CJAVal& content, string symbol = "", bool waitForResponse = true);
    bool SendHeartbeat();
    bool ProcessMessages(bool force = false);
    bool ForcePoll() { return ProcessMessages(true); } // Bypass timer check logic in ProcessMessages
    int GetMessages(CJAVal &messagesArray);
    
    // Symbol Helper Methods
    string GetNormalizedSymbol(string brokerSymbol);
    string GetBrokerSymbol(string normalizedSymbol);
    
    // UBCP Accessors
    string GetPrivatePipeName() { return m_privatePipeName; }
    int    GetCommandPipeHandle() { return m_hCommandPipe; }
    ConnectionState GetState() { return m_state; }
};

CDatafeedClient::CDatafeedClient(string pipeName)
{
    m_privatePipeName = "";
    m_hCommandPipe = INVALID_HANDLE;
    m_pipeHeartbeatName = PIPE_HEARTBEAT_NAME;
    m_lastTimestamp = 0;
    m_pollIntervalSeconds = 1;
    m_lastPollTime = 0;
    m_lastHeartbeatTime = 0;
    m_symbol = _Symbol;
    
    // Auto-Detect Mode based on Pipe Name
    if (StringFind(pipeName, "Ticks") != -1) {
        // Ticks Client: Direct Connection, No Handshake
        m_privatePipeName = pipeName;
        m_state = STATE_CONNECTED;
        Print("[DatafeedClient] Initialized in DIRECT (Ticks) mode: ", pipeName);
    } else {
        // Command Client: Use Handshake Protocol
        m_state = STATE_DISCONNECTED;
        // m_privatePipeName will be set after Handshake
    }
    m_timezoneSignature = "EET";
    m_rxBuffer = "";
}

CDatafeedClient::~CDatafeedClient()
{
}

bool CDatafeedClient::LoadConfig(string configFile)
{
    BotConfig config;
    if (CConfigLoader::LoadConfig(configFile, config)) {
        m_botId = config.botId;
        // Force suffix for Datafeed Bot to match UI expectation
        if (StringFind(m_botId, "_DATAFEED") == -1) {
             m_botId += "_DATAFEED";
        }
        m_pollIntervalSeconds = config.pollInterval;
        return true;
    }
    return false;
}

// Logic: Basic suffix/prefix handling if needed, otherwise passthrough
string CDatafeedClient::GetNormalizedSymbol(string brokerSymbol) { return brokerSymbol; } 
string CDatafeedClient::GetBrokerSymbol(string normalizedSymbol) { return normalizedSymbol; }

bool CDatafeedClient::SendMessage(string type, CJAVal& content, string symbol = "", bool waitForResponse = true)
{
    CJAVal body;
    body["type"] = type;
    body["content"].Set(content);
    body["symbol"] = (symbol == "") ? m_symbol : symbol;
    body["sender"] = "Bot";
    body["botId"] = m_botId;
    body["timestamp"] = (long)TimeCurrent();
    body["customId"] = IntegerToString(TimeLocal()) + "-" + IntegerToString(GetTickCount()) + "-" + IntegerToString(MathRand());
    body["environment"] = "LIVE"; // Simplified
    
    // ROUTING LOGIC
    if (type == "HISTORY_DATA" || type == "HISTORY_BULK_RESPONSE") {
        return SendToPipeNamed(body.Serialize(), PIPE_HISTORY_NAME, waitForResponse);
    }
    if (type == "STATUS_HEARTBEAT") {
        return SendToPipeNamed(body.Serialize(), m_pipeHeartbeatName, waitForResponse);
        // Also ensure connected logic? Heartbeat usually runs independent.
    }

    if (m_state != STATE_CONNECTED) return false;

    return SendToPipe(body.Serialize(), waitForResponse);
}

bool CDatafeedClient::SendToPipe(string message, string &response, bool waitForResponse)
{
   if (m_state != STATE_CONNECTED) return false;
   return SendToPipe(message, response, m_privatePipeName, waitForResponse);
}

bool CDatafeedClient::SendToPipe(string message, string &response, string pipeName, bool waitForResponse)
{
   response = "";
   string payload = message + "\n";
   
   // Handle Management: Use Persistent or Open Transient
   int hPipe = INVALID_HANDLE;
   bool isPersistent = false;
   
   if (pipeName == m_privatePipeName && m_hCommandPipe != INVALID_HANDLE) {
       hPipe = m_hCommandPipe;
       isPersistent = true;
       // Print("[PipeClient] Sending via PERSISTENT handle"); 
   } else {
       hPipe = FileOpen(pipeName, FILE_READ|FILE_WRITE|FILE_BIN); // Transient
       // if (pipeName == m_privatePipeName) Print("[PipeClient] Sending via TRANSIENT handle (Persistent Invalid)");
   }

    if(hPipe != INVALID_HANDLE) {
       uchar buffer[];
       StringToCharArray(payload, buffer, 0, WHOLE_ARRAY, CP_UTF8);
       int len = ArraySize(buffer);
       if (len > 0 && buffer[len-1] == 0) len--; 
       
       uint written = FileWriteArray(hPipe, buffer, 0, len);
       if (written != len) {
           int err = GetLastError();
           Print("[PipeClient] ⚠️ WRITE FAILED. Err=", err, " Pipe=", pipeName);
           FileClose(hPipe);
           if (isPersistent) {
               m_hCommandPipe = INVALID_HANDLE;
               m_state = STATE_DISCONNECTED;
               Print("[PipeClient] 💥 Persistent Pipe Broken. State -> DISCONNECTED");
           }
           return false;
       }
       
       FileFlush(hPipe);
       
       if (!waitForResponse) {
           if (!isPersistent) FileClose(hPipe);
           return true;
       }
       
       // Read Response Logic (Simplified)
        string accumulatedResponse = "";
        int attempts = 0;
        // Increase timeout to 2000ms (200 * 10ms) to handle large config payloads
        while(attempts < 200) {
            if(!FileIsEnding(hPipe)) {
               uchar chunk[]; ArrayResize(chunk, 4096); 
               uint readCallback = FileReadArray(hPipe, chunk);
               if (readCallback > 0) { 
                   ArrayResize(chunk, readCallback); 
                   string partial = CharArrayToString(chunk, 0, WHOLE_ARRAY, CP_UTF8);
                   accumulatedResponse += partial;
               }
            } else { 
                // Pipe Empty (Temporarily). Check if we have a complete NDJSON message (Ends with \n)
                if (StringLen(accumulatedResponse) > 0) {
                     ushort lastChar = StringGetCharacter(accumulatedResponse, StringLen(accumulatedResponse)-1);
                     if (lastChar == 10) break; // Found Newline -> Complete
                }
            }
            // Guard: If we have data but no newline for too long, just return what we have (Emergency Break)
            if (StringLen(accumulatedResponse) > 0 && attempts > 150) break; 
            
            Sleep(10); attempts++;
         }
        
        if (StringLen(accumulatedResponse) > 0) {
            response = accumulatedResponse;
            if (!isPersistent) FileClose(hPipe);
            return true; // Success
        }
        
        response = accumulatedResponse;
        if (!isPersistent) FileClose(hPipe);
        return true;
    } else {
        int err = GetLastError();
        // User Requirement 3: Heartbeat Persistence Log
        if (pipeName == m_pipeHeartbeatName) {
            Print("[Datafeed] ⚠️ Heartbeat lost (Err=", err, "). Retrying connection...");
        } else {
            Print("[PipeClient] ERROR: Failed to open pipe: ", pipeName, " Err=", err);
        }
        
        // Critical: If persistent pipe failed to open? 
        // Logic above only tries to reopen in CheckCommandPipe if INVALID.
        // But if hPipe came from m_hCommandPipe and was VALID, we wouldn't be here (outer if).
        return false;
    }
    return false;
 }

bool CDatafeedClient::SendToPipe(string message, bool waitForResponse) { string dummy; return SendToPipe(message, dummy, m_privatePipeName, waitForResponse); }
bool CDatafeedClient::SendToPipeNamed(string message, string pipeName, bool waitForResponse) { string dummy; return SendToPipe(message, dummy, pipeName, waitForResponse); }

bool CDatafeedClient::ProcessMessages(bool force)
{
    datetime currentTime = TimeLocal();
    
    // 1. Heartbeat (ALWAYS send, even if detached, so Node sees us Alive)
    if (currentTime - m_lastHeartbeatTime >= 5) { 
        SendHeartbeat(); // Fires UDP or Transient pipe
        m_lastHeartbeatTime = currentTime; 
    }

    // 2. Connection State Machine
    CheckConnection();

    if (m_state != STATE_CONNECTED) return false;
    
    // 3. Process PUSHED commands (Non-Blocking, High Speed)
    // Always try to read from persistent pipe if open
    if (m_hCommandPipe != INVALID_HANDLE) {
        ReadCommandPipe(); 
    }
    
    // 4. Command Polling
    if (!force && currentTime - m_lastPollTime < m_pollIntervalSeconds) return true; 
    
    if (force) Print("[DatafeedClient] ⚡ Forcing Poll (Bypassing Timer).");
    m_lastPollTime = currentTime;
    
    CJAVal messagesArray;
    int count = GetMessages(messagesArray); 
    return (count >= 0);
}

void CDatafeedClient::CheckConnection()
{
    if (m_state == STATE_DISCONNECTED) {
        Print("[Datafeed:Conn] State: DISCONNECTED -> REGISTERING");
        m_state = STATE_REGISTERING;
    }
    
    if (m_state == STATE_REGISTERING) {
        if (RegisterBot()) {
            Print("[Datafeed:Conn] Registered. Switching to CONNECTING...");
            m_state = STATE_CONNECTING;
        } else {
            // Retry next tick, no blocking
        }
    }
    else if (m_state == STATE_CONNECTING) {
        // Poll for private pipe availability
        string pipeName = "\\\\.\\pipe\\MT5_Core_Command_" + m_botId;
        
        if (FileIsExist(pipeName)) {
             m_privatePipeName = pipeName;
             m_state = STATE_CONNECTED;
             Print("[Datafeed:Conn] Private Pipe Found: ", pipeName, ". State -> CONNECTED");
             CheckCommandPipe(); // Attempt Open Immediately
        } else {
             // Print("[Datafeed:Conn] Waiting for Pipe: ", pipeName);
        }
    }
    else if (m_state == STATE_CONNECTED) {
        CheckCommandPipe();
    }
}

void CDatafeedClient::CheckCommandPipe()
{
    if (m_hCommandPipe == INVALID_HANDLE && m_privatePipeName != "") {
        // OPEN PERSISTENT HANDLE
        // REMOVED FILE_SHARE flags which might be problematic
        m_hCommandPipe = FileOpen(m_privatePipeName, FILE_READ|FILE_WRITE|FILE_BIN);
        
        if (m_hCommandPipe != INVALID_HANDLE) {
            Print("[Datafeed:Pipe] Persistent Command Pipe OPENED. Handle=", m_hCommandPipe);
        } else {
             Print("[Datafeed:Pipe] Failed to Open Persistent Pipe: ", m_privatePipeName, " Err=", GetLastError());
        }
    }
}



// FIX: Persistent Ring Buffer equivalent logic using string concatenation
int CDatafeedClient::ReadCommandPipe(CJAVal &messagesArray)
{
    if (m_hCommandPipe == INVALID_HANDLE) return 0;
    
    // Check if data is available using native MQL5 FileSize (returns Bytes Available for pipes)
    long available = (long)FileSize(m_hCommandPipe);
    
    if (available > 0) {
        uchar chunk[]; ArrayResize(chunk, 4096);
        
        // Read available chunk
        uint readCallback = FileReadArray(m_hCommandPipe, chunk);
        if (readCallback > 0) {
            string partial = CharArrayToString(chunk, 0, readCallback, CP_UTF8);
            m_rxBuffer += partial; // APPEND to CLASS MEMBER
        } else {
            // Error handling...
            int err = GetLastError();
            Print("[Datafeed:Push] ⚠️ Read Failed. Err=", err);
            FileClose(m_hCommandPipe);
            m_hCommandPipe = INVALID_HANDLE;
            m_state = STATE_DISCONNECTED;
            m_rxBuffer = ""; // Reset
            return 0;
        }
        
        if (StringLen(m_rxBuffer) > 0) {
            // Check for Frame Boundary (\n)
            int lastNewline = StringFind(m_rxBuffer, "\n", 0);
            
            // Optimization: If no newline, return 0 and wait for more data (Persistent Buffer holds partial)
            if (lastNewline < 0) return 0;
            
            // Loop to extract ALL complete lines
            int valid = 0;
            while(true) {
                 int nl = StringFind(m_rxBuffer, "\n");
                 if (nl < 0) break;
                 
                 string line = StringSubstr(m_rxBuffer, 0, nl); // Extract Line
                 m_rxBuffer = StringSubstr(m_rxBuffer, nl + 1); // Shift Buffer
                 
                 StringTrimRight(line); StringTrimLeft(line);
                 if (line == "") continue;
                 
                 // Handle NO_OP (Keep Alive)
                 if (StringFind(line, "NO_OP") >= 0) continue;
                 
                 CJAVal json;
                 if (json.Deserialize(line)) { 
                     ProcessIncomingMessages(json);
                     valid++;
                 } else {
                     Print("[Datafeed] ⚠️ JSON Parse Fail (Fragment?): ", StringSubstr(line, 0, 50), "...");
                 }
            }
            return valid;
        }
    } else if (available < 0) {
        // FileSize Error
        FileClose(m_hCommandPipe);
        m_hCommandPipe = INVALID_HANDLE;
        m_state = STATE_DISCONNECTED;
        m_rxBuffer = "";
    }
    return 0;
}

// Helper overload
int CDatafeedClient::ReadCommandPipe() { CJAVal dummy; return ReadCommandPipe(dummy); }


bool CDatafeedClient::RegisterBot()
{
    // Write-Only to Discovery Pipe to prevent destructive read
    int h = FileOpen(PIPE_DISCOVERY_NAME, FILE_WRITE|FILE_BIN);
    if (h != INVALID_HANDLE) {
        CJAVal regMsg;
        regMsg["type"] = "REGISTER";
        regMsg["botId"] = m_botId;
        regMsg["timezone"] = m_timezoneSignature;
        
        string payload = regMsg.Serialize() + "\n";
        
        uchar buffer[];
        StringToCharArray(payload, buffer, 0, WHOLE_ARRAY, CP_UTF8);
        int len = ArraySize(buffer);
        if (len > 0 && buffer[len-1] == 0) len--; 
        FileWriteArray(h, buffer, 0, len);
        FileFlush(h);
        FileClose(h);
        return true;
    }
    return false;
}

int CDatafeedClient::GetMessages(CJAVal &messagesArray)
{
    if (m_state != STATE_CONNECTED) return 0;

    CJAVal pollMsg;
    pollMsg["type"] = "CMD_POLL";
    pollMsg["botId"] = m_botId;
    pollMsg["timestamp"] = (long)TimeCurrent();
    
    string response = "";
    // SendToPipe uses m_privatePipeName when state is CONNECTED
    if (SendToPipe(pollMsg.Serialize(), response))
    {
        if (response != "") 
        {
            string lines[];
            int count = StringSplit(response, '\n', lines);
            for(int i=0; i<count; i++) {
               string line = lines[i]; StringTrimRight(line); StringTrimLeft(line);
               if (line == "") continue;
               CJAVal json;
               if (json.Deserialize(line)) { messagesArray.Add(json); ProcessIncomingMessages(json); }
            }
            return count;
        }
    }
    return 0;
}

void CDatafeedClient::ProcessIncomingMessages(CJAVal &messages)
{
    if (messages.m_type == jtARRAY) {
        int count = messages.Size();
        for(int i = 0; i < count; i++) { CJAVal *msgPtr = messages[i]; if(msgPtr != NULL) ProcessSingleMessage(*msgPtr); }
    } else if (messages.m_type == jtOBJ) ProcessSingleMessage(messages);
}

void CDatafeedClient::ProcessSingleMessage(CJAVal &msg)
{
    // Deduplication
    CJAVal *timeVal = msg.HasKey("timestamp");
    if (timeVal != NULL) {
        long ts = StringToInteger(timeVal.ToStr());
        // Relaxed check: Allow same timestamp (rare batch case), only reject if strictly OLDER.
        // Also, since DB handles consumption (isActive=0), we can trust the source more.
        if (ts < m_lastTimestamp) {
            // Print("[Datafeed:Warning] Ignoring old message. TS=", ts, " Last=", m_lastTimestamp);
            return;
        }
        m_lastTimestamp = ts;
    }
    
    // Targeting
    if (msg.HasKey("targetBotId")) {
         string target = msg["targetBotId"].ToStr();
         if (target != "**" && target != m_botId) return;
    }

    string type = msg.HasKey("type") ? msg["type"].ToStr() : "";
    if (type != "NO_OP") {
         Print("[Datafeed] Processing Message: ", type, " (BotID: ", m_botId, ")");
    }
    
    if (StringFind(type, "CMD_") == 0) {
        if (m_commandHandler != NULL) m_commandHandler.HandleCommand(type, msg);
        return;
    }
}

bool CDatafeedClient::SendHeartbeat()
{
   CJAVal content;
   content["mt5_alive"] = true;
   content["type"] = "DATAFEED";
   
   // Account Object
   CJAVal accountObj;
   accountObj["connected"] = (bool)(TerminalInfoInteger(TERMINAL_CONNECTED));
   accountObj["login"] = AccountInfoInteger(ACCOUNT_LOGIN);
   accountObj["trade_allowed"] = (bool)AccountInfoInteger(ACCOUNT_TRADE_ALLOWED);
   accountObj["equity"] = AccountInfoDouble(ACCOUNT_EQUITY);
   accountObj["balance"] = AccountInfoDouble(ACCOUNT_BALANCE);
   content["account"].Set(accountObj);

   // Expert Object
   CJAVal expertObj;
   expertObj["active"] = true;
   expertObj["allowed"] = (bool)TerminalInfoInteger(TERMINAL_TRADE_ALLOWED) && (bool)MQLInfoInteger(MQL_TRADE_ALLOWED);
   content["expert"].Set(expertObj);

   content["expert"].Set(expertObj);
   
   // Fire and Forget Heartbeat!
   return SendMessage("STATUS_HEARTBEAT", content, "", false); 
}

bool CDatafeedClient::UpdateMessageStatus(string messageId, bool isActive)
{
    CJAVal statusMsg;
    statusMsg["type"] = "MSG_STATUS_UPDATE";
    statusMsg["messageId"] = messageId;
    statusMsg["isActive"] = isActive;
    return SendMessage("MSG_STATUS_UPDATE", statusMsg);
}
#endif
