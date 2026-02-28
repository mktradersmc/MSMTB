//+------------------------------------------------------------------+
//|                                                    AppClient.mqh |
//|                                    Copyright 2025, MetaQuotes Ltd.|
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, MetaQuotes Ltd."
#property link      "https://www.mql5.com"

#include "JAson.mqh" // CHANGED: Local include
#include <Files\FilePipe.mqh> 

// Pipe Names
#define PIPE_DISCOVERY_NAME "\\\\.\\pipe\\MT5_Node_Commands" // Matches Backend PIPE_NAME_COMMANDS
#define PIPE_HEARTBEAT_NAME "\\\\.\\pipe\\MT5_Node_Heartbeat"
#define PIPE_NAME_LEGACY "\\\\.\\pipe\\MT5_Node_Commands" // (Unused fallback) 

enum AppConnectionState {
    APP_STATE_DISCONNECTED,
    APP_STATE_REGISTERING,
    APP_STATE_CONNECTING,
    APP_STATE_CONNECTED
};

// Interface for Command Handler
class ICommandHandler {
public:
    virtual void HandleCommand(string type, CJAVal& payload) = 0;
};

class CAppClient
{
private:
    static CAppClient* m_instance;
    
    // Configuration
    string m_botId;
    string m_apiKey;
    string m_sendMessageUrl;
    string m_getMessagesUrl;
    string m_updateMessageStatusUrl;
    int    m_pollIntervalMs;  
    string m_communicationMode; 
    
    // State
    string m_symbol;
    long   m_lastTimestamp; 
    bool   m_errorPrinted;
    ulong  m_lastPollTime;    
    ulong  m_lastHeartbeatTime; 
    ulong  m_lastStatusUpdateTime;   // ✅ PERFORMANCE FIX: Throttle status updates
    ulong  m_statusFailureStartTime; // For throttling logs
    ulong  m_lastStatusErrorLogTime; 
    
    string m_exchangePath;      
    long   m_lastCommandTimestamp; 
    long   m_lastOutputFileSize;   
    
    // Pipe State
    string m_privatePipeName;
    int    m_hCommandPipe; // Persistent Handle
    AppConnectionState m_state;
    string m_timezoneSignature; 
    
    // Deduplication State
    string m_processedIds[50]; // Circular Buffer
    int    m_processedIdHead; 

    // Command Handler
    ICommandHandler* m_commandHandler;
    
    CAppClient(); 
    void ParseConfigLine(string line);
    bool UpdateMessageStatus(string messageId, bool isActive);
    
    // Internal File Methods
    bool SendMessageToFile(CJAVal& body);
    int GetMessagesFromFile(CJAVal &messagesArray);
    
    // Connection Logic
    void CheckConnection();
    void CheckCommandPipe(); // New: Maintain persistent connection
    bool RegisterBot();
    
    // Domain logic for messages (Filters and Adds to Output)
    void ProcessIncomingMessages(CJAVal &messages, CJAVal &outputArray);
    void ProcessSingleMessage(CJAVal &msg, CJAVal &outputArray);
    int  ReadCommandPipe(CJAVal &messagesArray); // New: Non-blocking read

public:
    static CAppClient* GetInstance();
    
    void SetCommandHandler(ICommandHandler* handler) { m_commandHandler = handler; }
    string GetBotId() { return m_botId; }
    void SetTimezoneSignature(string sig) { m_timezoneSignature = sig; }
    
    bool SendMessage(string type, CJAVal& content, string symbol = "", bool waitForResponse = true);
    bool ProcessMessages();
    bool ProcessMessages(CJAVal &output);
    int GetMessages(CJAVal &messagesArray);
    void SetSymbol(string symbol);
    bool SendNewTradeSignal(string strategy, string direction, string messageText, datetime signalTime);
    bool SendReplicationTrade(CJAVal &tradeData);
    bool SendSetup(string strategy, string status, string details);
    bool SendCondition(string name, string value);
    bool ProcessCommands();
    void SendAvailableSymbols(); 
    string GetCommunicationMode() { return m_communicationMode; }
    
    bool LoadConfig(string configFile="bot_properties.txt"); 
    bool SendHeartbeat(); 
    bool SendStatusUpdate();
    
    // Low-level Pipe Access
    bool SendToPipe(string message, string &response, string pipeName, bool waitForResponse=true);
    bool SendToPipe(string message, string &response);
    bool SendToPipe(string message);
};

// Global pointer to the singleton instance
CAppClient* CAppClient::m_instance = NULL;

// Implementation
CAppClient::CAppClient()
{
    m_communicationMode = "HTTP"; 
    m_exchangePath = "";
    m_lastCommandTimestamp = 0;
    m_lastOutputFileSize = 0;
    m_commandHandler = NULL;
    m_state = APP_STATE_DISCONNECTED;
    m_privatePipeName = "";
    m_hCommandPipe = INVALID_HANDLE;
    m_pollIntervalMs = 1000; 
    
    if (!LoadConfig()) {
        Print("Failed to load configuration. Please check bot_properties.txt file.");
    }
    
    m_symbol = _Symbol;
    m_lastTimestamp = 0;
    m_errorPrinted = false;
    m_lastPollTime = 0;
    m_lastHeartbeatTime = 0;
    m_lastStatusUpdateTime = 0;      // ✅ Initialize status update timer
    m_statusFailureStartTime = 0;
    m_lastStatusErrorLogTime = 0;
    m_lastStatusErrorLogTime = 0;
    m_timezoneSignature = "EET"; 
    
    // Init Buffer
    m_processedIdHead = 0;
    for(int i=0; i<50; i++) m_processedIds[i] = ""; 
}

bool CAppClient::LoadConfig(string configFile)
{
    string filename = configFile;
    Print("Loading "+TerminalInfoString(TERMINAL_DATA_PATH)+"\\MQL5\\Files\\"+filename);
    int fileHandle = FileOpen(filename, FILE_TXT|FILE_READ|FILE_ANSI, 0, CP_UTF8);

    if (fileHandle == INVALID_HANDLE) {
        Print("Error opening file "+filename+" (checked Common and Local): ", GetLastError());
        return false;
    }
      
    string line;
    while(!FileIsEnding(fileHandle)) {
       line = FileReadString(fileHandle);
       ParseConfigLine(line);
    }
    FileClose(fileHandle);    
    
    if (m_communicationMode == "FILE") {
         if (m_exchangePath == "") {
             Print("Communication Mode FILE requires exchangePath to be set!");
             return false;
         }
         return true; 
    }

    if (m_botId == "" || m_communicationMode == "") {
        Print("Missing required configuration parameters.");
        return false;
    }
    
    Print("Loaded Bot Properties: BotId="+m_botId+" Mode="+m_communicationMode+" Poll="+IntegerToString(m_pollIntervalMs)+"ms");

    if (m_communicationMode == "PIPE") {
        m_state = APP_STATE_DISCONNECTED;
    }
    
    return true;
}

void CAppClient::ParseConfigLine(string line)
{
    string key, value;
    string parts[];
    StringSplit(line, '=', parts);
    if (ArraySize(parts) == 2)
    {
        key = parts[0]; StringTrimLeft(key); StringTrimRight(key);
        value = parts[1]; StringTrimLeft(value); StringTrimRight(value);
        
        if (key == "botId") m_botId = value;
        else if (key == "apiKey") m_apiKey = value;
        else if (key == "sendMessageUrl") m_sendMessageUrl = value;
        else if (key == "getMessagesUrl") m_getMessagesUrl = value;
        else if (key == "updateMessageStatusUrl") m_updateMessageStatusUrl = value;
        else if (key == "pollInterval") m_pollIntervalMs = (int)StringToInteger(value); 
        else if (key == "communicationMode") m_communicationMode = value;
        else if (key == "exchangePath") m_exchangePath = value;
    }
}

CAppClient* CAppClient::GetInstance()
{
    if(m_instance == NULL) m_instance = new CAppClient();
    return m_instance;
}

bool CAppClient::SendMessage(string type, CJAVal& content, string symbol = "", bool waitForResponse = true)
{
    CJAVal body;
    body["type"] = type;
    body["content"].Set(content);
    body["symbol"] = (symbol == "") ? m_symbol : symbol;
    body["sender"] = "Bot";
    body["botId"] = m_botId;
    body["timestamp"] = (long)TimeCurrent();
    
    string customId = IntegerToString(TimeLocal()) + "-" + IntegerToString(GetTickCount()) + "-" + IntegerToString(MathRand());
    body["customId"] = customId;

    bool isTester = (bool)MQLInfoInteger(MQL_TESTER);
    body["environment"] = isTester ? "BACKTEST" : "LIVE";
    
    // Low-level debug only for non-ticks
    if (type != "TICK_DATA" && type != "STATUS_HEARTBEAT" && type != "STATUS_UPDATE") Print("[Pipe] Sending message: ", type);
    
    // Special Routing for Heartbeat and Status Update
    if (type == "STATUS_HEARTBEAT" || type == "STATUS_UPDATE") {
        string response;
        // Fire-and-Forget by default for high-frequency status
        if (!waitForResponse) {
             string pipeToUse = PIPE_HEARTBEAT_NAME;
             // Use persistent pipe if configured and connected
             if (m_state == APP_STATE_CONNECTED && m_privatePipeName != "") {
                 pipeToUse = m_privatePipeName;
             }

             bool sent = SendToPipe(body.Serialize(), response, pipeToUse, false); 
             if (!sent) {
                 ulong now = GetTickCount64();
                 if (m_statusFailureStartTime == 0) m_statusFailureStartTime = now;
                 
                 ulong elapsed = now - m_statusFailureStartTime;
                 if (elapsed > 30000) { // 30s Persistence Check
                     if (now - m_lastStatusErrorLogTime > 30000) { // Throttle Log (once every 30s)
                         Print("[Bot] Failed to send Status/Heartbeat (FireAndForget) - Persisting for " + IntegerToString(elapsed/1000) + "s");
                         m_lastStatusErrorLogTime = now;
                     }
                 }
                 return false;
             } else {
                 // Reset on success
                 m_statusFailureStartTime = 0;
                 m_lastStatusErrorLogTime = 0;
             }
             return true;
        }
        bool res = SendToPipe(body.Serialize(), response, PIPE_HEARTBEAT_NAME, true);
        if (!res) Print("[Bot] Failed to send Status/Heartbeat.");
        return res;
    }
    
    // Standard Message
    // Currently SendToPipe does NOT support bool waitForResponse directly in this class yet
    // We need to overload SendToPipe to support it, or just ignore response reading if false.
    
    string response;
    bool res = SendToPipe(body.Serialize(), response); // Default Pipe
    if (!res) Print("[Bot] Failed to send message of type ", type, " via Pipe.");
    return res;
}

bool CAppClient::UpdateMessageStatus(string messageId, bool isActive)
{
    CJAVal statusMsg;
    statusMsg["type"] = "MSG_STATUS_UPDATE";
    statusMsg["messageId"] = messageId;
    statusMsg["isActive"] = isActive;
    return SendMessage("MSG_STATUS_UPDATE", statusMsg);
}

void CAppClient::CheckConnection()
{
    if (m_communicationMode != "PIPE") return;

    if (m_state == APP_STATE_DISCONNECTED) {
        m_state = APP_STATE_REGISTERING;
    }
    
    if (m_state == APP_STATE_REGISTERING) {
        if (RegisterBot()) {
            Print("[AppClient:Conn] Registered. Switching to CONNECTING...");
            m_state = APP_STATE_CONNECTING;
        }
    }
    else if (m_state == APP_STATE_CONNECTING) {
        string pipeName = "\\\\.\\pipe\\MT5_Core_Command_" + m_botId;
        if (FileIsExist(pipeName)) {
             m_privatePipeName = pipeName;
             m_state = APP_STATE_CONNECTED;
             Print("[AppClient:Conn] Private Pipe Found: ", pipeName);
             CheckCommandPipe(); // Attempt Open Immediately
        }
    }
    else if (m_state == APP_STATE_CONNECTED) {
        CheckCommandPipe();
    }
}

void CAppClient::CheckCommandPipe()
{
    if (m_hCommandPipe == INVALID_HANDLE && m_privatePipeName != "") {
        // Open Persistent Handle for Async Reads (Push)
        m_hCommandPipe = FileOpen(m_privatePipeName, FILE_READ|FILE_WRITE|FILE_BIN|FILE_SHARE_READ|FILE_SHARE_WRITE);
        if (m_hCommandPipe != INVALID_HANDLE) {
            Print("[AppClient:Pipe] Persistent Command Pipe OPENED. Handle=", m_hCommandPipe);
        } else {
            // Print("[AppClient:Pipe] Failed to open command pipe: ", GetLastError());
        }
    }
}

bool CAppClient::RegisterBot()
{
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

bool CAppClient::ProcessMessages()
{
    CJAVal dummy;
    return ProcessMessages(dummy);
}

bool CAppClient::ProcessMessages(CJAVal &outputMessages)
{
    ulong currentTime = GetTickCount64(); 

    // Heartbeat every 5000ms
    if (currentTime - m_lastHeartbeatTime >= 5000)
    {
       SendHeartbeat();
       m_lastHeartbeatTime = currentTime;
    }

    if (m_communicationMode == "PIPE") {
        CheckConnection();
        if (m_state != APP_STATE_CONNECTED) return false;
    }

    if (currentTime - m_lastPollTime < (ulong)m_pollIntervalMs) return true; 
    
    m_lastPollTime = currentTime;
    
    // ✅ PERFORMANCE FIX: Throttle Status Updates to max 10/second (100ms interval)
    // Prevents flooding pipe with 100-1000 updates/second during active ticks
    if (currentTime - m_lastStatusUpdateTime >= 100) {
        SendStatusUpdate();
        m_lastStatusUpdateTime = currentTime;
    }
    
    // 1. Process PUSHED commands (Non-Blocking, High Speed)
    if (m_communicationMode == "PIPE" && m_hCommandPipe != INVALID_HANDLE) {
        int pushedCount = ReadCommandPipe(outputMessages);
        if (pushedCount > 0) {
             // Print("[AppClient] Picked up ", pushedCount, " commands from PUSH Pipe.");
        }
    }
    
    // 2. Poll Backup (Low Frequency)
    int count = GetMessages(outputMessages); 
    return (count >= 0);
}

int CAppClient::ReadCommandPipe(CJAVal &messagesArray)
{
    if (m_hCommandPipe == INVALID_HANDLE) return 0;
    
    // Check if data is available using native MQL5 FileSize
    // For pipes, FileSize returns available bytes
    if (FileSize(m_hCommandPipe) > 0) {
        string accumulated = "";
        uchar chunk[]; ArrayResize(chunk, 4096);
        
        // Read all available
        int readCallback = FileReadArray(m_hCommandPipe, chunk);
        if (readCallback > 0) {
            accumulated = CharArrayToString(chunk, 0, readCallback, CP_UTF8);
        }
        
        if (accumulated != "") {
            if (StringFind(accumulated, "NO_OP") >= 0) return 0; // Ignore NO_OPs
            
            string lines[];
            int count = StringSplit(accumulated, '\n', lines);
            int valid = 0;
            
            for(int i=0; i<count; i++) {
               string line = lines[i]; StringTrimRight(line); StringTrimLeft(line);
               if (line == "") continue;
               
            CJAVal json;
               if (json.Deserialize(line)) { 
                   // Deduplication Logic handles addition
                   ProcessIncomingMessages(json, messagesArray);
                   valid++;
               }
            }
            return valid;
        }
    }
    return 0;
}

void CAppClient::ProcessIncomingMessages(CJAVal &messages, CJAVal &outputArray)
{
    if (messages.m_type == jtARRAY) {
        int count = messages.Size();
        for(int i = 0; i < count; i++) { 
             CJAVal *msgPtr = messages[i]; 
             if(msgPtr != NULL) ProcessSingleMessage(*msgPtr, outputArray); 
        }
    }
    else if (messages.m_type == jtOBJ) ProcessSingleMessage(messages, outputArray);
}

void CAppClient::ProcessSingleMessage(CJAVal &msg, CJAVal &outputArray)
{
    // 1. DEDUPLICATION via ID (Primary)
    string msgId = "";
    if (msg.HasKey("customId")) msgId = msg["customId"].ToStr();
    else if (msg.HasKey("id")) msgId = msg["id"].ToStr(); // Fallback
    
    if (msgId != "") {
        // Check Buffer
        for(int i=0; i<50; i++) {
            if (m_processedIds[i] == msgId) {
                 Print("[AppClient] DROPPED DUPLICATE (ID-Match): ", msgId);
                 return;
            }
        }
        
        // Add to Buffer (Circular)
        m_processedIds[m_processedIdHead] = msgId;
        m_processedIdHead = (m_processedIdHead + 1) % 50;
    }

    // 2. Timestamp Integrity (Secondary - Keep local clock sync but relax filtering)
    CJAVal *timeVal = msg.HasKey("timestamp");
    if (timeVal != NULL)
    {
        long ts = StringToInteger(timeVal.ToStr());
        if (ts > m_lastTimestamp) m_lastTimestamp = ts;
    }

    // Targeting Logic
    if (msg.HasKey("targetBotId")) {
         string target = msg["targetBotId"].ToStr();
         if (target != "**" && target != m_botId) {
             Print("[AppClient] REJECTED: targetBotId mismatch. Me=", m_botId, " Target=", target);
             return;
         }
    }

    string type = "UNKNOWN";
    CJAVal* typeVal = msg.HasKey("type");
    if (typeVal != NULL) type = (*typeVal).ToStr();
    
    if (type == "NO_OP") return;

    string sender = "";
    CJAVal* s = msg.HasKey("sender");
    if (s != NULL) sender = (*s).ToStr();
    
    if(sender == "") sender = "App"; // Defensive

    // VERBOSE LOGGING
    Print("[AppClient] Processing Msg: Type=", type, " Sender=", sender, " JSON=", msg.Serialize());
    
    // FORENSIC
    CJAVal* c = msg.HasKey("customId"); // Use HasKey to get pointer
    if (c != NULL) {
        string cid = (*c).ToStr();
        if (StringFind(cid, "TRC-") >= 0) {
             Print("[Forensic] ", cid, " | 5. Bot Process | Type=", type);
        }
    }
    
    if (StringFind(type, "CMD_") == 0 || type == "EXECUTE_TRADE") {
        long cmdTs = 0;
        CJAVal* t = msg.HasKey("timestamp");
        if (t != NULL) cmdTs = StringToInteger((*t).ToStr());
        
        if (type == "EXECUTE_TRADE" || cmdTs > m_lastCommandTimestamp) {
            if (m_commandHandler != NULL) m_commandHandler.HandleCommand(type, msg);
            if (cmdTs > 0) m_lastCommandTimestamp = cmdTs;
            
            // ACK User Action
            if (type == "EXECUTE_TRADE") {
                 CJAVal* idVal = msg.HasKey("id");
                 if (idVal != NULL) UpdateMessageStatus((*idVal).ToStr(), false);
            }
        } else {
             Print("[AppClient] WARNING: Dropped Command ", type, " due to Timestamp Logic. CmdTS=", cmdTs, " Last=", m_lastCommandTimestamp);
             return; // Drop from Array
        }
        
         // Add to Output if Valid
         outputArray.Add(msg);
         return;
    }

    if(sender == "App") {
        CJAVal *symbolVal = msg.HasKey("symbol");
        string msgSymbol = "*";
        if (symbolVal != NULL) msgSymbol = (*symbolVal).ToStr();
        
        // Explicit symbol check
        string mySymbol = m_symbol; // [FIX] Removed Dependency
        bool isForMe = (msgSymbol == "*" || msgSymbol == mySymbol);

        if (isForMe) {
             Print("RAW MSG: ", msg.Serialize()); 
             outputArray.Add(msg);
             
             CJAVal* content = msg["content"];
             // Logic to handle content if implementation requires it here? 
             // Actually ProcessSingleMessage usually just filters? 
             // Wait, previous code didn't do much inside isForMe other than Print?
             // Ah, earlier versions had more logic?
             // checking step 2127: CJAVal* content = msg["content"]; ... then cut off.
        }
    }
}

// --- PRIORITY QUEUE HELPER ---
#include <Arrays\ArrayObj.mqh>

class CMessageItem : public CObject {
public:
    CJAVal* m_val;
    int m_priority;
    long m_timestamp;
    
    CMessageItem(CJAVal* v) {
        m_val = new CJAVal();
        m_val.Copy(v); // Deep Copy needed? CJAVal copy constructor usually works
        
        // Extract Priority & Time
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
            // Try to extract time from customId (ts-tick-rand)
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

int CAppClient::GetMessages(CJAVal &messagesArray)
{
    CJAVal pollMsg;
    pollMsg["type"] = "CMD_POLL";
    pollMsg["botId"] = m_botId;
    pollMsg["timestamp"] = (long)TimeCurrent();
    
    string response = "";
    if (SendToPipe(pollMsg.Serialize(), response))
    {
        if (response != "") 
        {
            string lines[];
            int count = StringSplit(response, '\n', lines);
            
            CArrayObj buffer;
            buffer.FreeMode(true); // Owns objects
            
            for(int i=0; i<count; i++)
            {
               string line = lines[i]; StringTrimRight(line); StringTrimLeft(line);
               if (line == "" || line == "NO_OP") continue;
               
               CJAVal json;
               if (json.Deserialize(line)) { 
                   if (json["type"].ToStr() == "NO_OP") continue;
                   // Create Item (filters priority etc)
                   buffer.Add(new CMessageItem(&json));
               } else {
                   Print("[AppClient] CRITICAL: JSON Deserialization FAILED for line: ", line);
               }
            }
            
            // SORT
            if (buffer.Total() > 1) {
                buffer.Sort();
                // Log Sort Result for Debugging
                Print("[AppClient] 🧹 Sorted ", buffer.Total(), " messages. Top Priority: ", ((CMessageItem*)buffer.At(0)).m_priority);
            }
            
            // EXECUTE / TRANSFER
            int validCount = 0;
            for (int i=0; i<buffer.Total(); i++) {
                CMessageItem* item = (CMessageItem*)buffer.At(i);
                if (item && item.m_val) {
                     // Check and Add
                     ProcessIncomingMessages(*(item.m_val), messagesArray);
                     validCount++;
                 }
             }
             
             return validCount;
         }
     }
     return 0;
 }

bool CAppClient::SendMessageToFile(CJAVal& body) { return false; } 
bool CAppClient::ProcessCommands() { return false; }
int CAppClient::GetMessagesFromFile(CJAVal &messagesArray) { return 0; }

bool CAppClient::SendToPipe(string message, string &response) {
    return SendToPipe(message, response, m_privatePipeName);
}

bool CAppClient::SendToPipe(string message, string &response, string pipeName, bool waitForResponse)
{
    if (m_communicationMode == "PIPE" && m_state != APP_STATE_CONNECTED) {
       if (pipeName == "" || (pipeName != PIPE_HEARTBEAT_NAME && pipeName != PIPE_DISCOVERY_NAME)) return false;
    }
   response = "";
   string targetPipe = (pipeName != "") ? pipeName : PIPE_NAME_LEGACY; 
   if (pipeName == "") return false;

   string payload = message + "\n";
   
   // Handle Management: Use Persistent or Open Transient
   int hPipe = INVALID_HANDLE;
   bool isPersistent = false;
   
   if (pipeName == m_privatePipeName && m_hCommandPipe != INVALID_HANDLE) {
       hPipe = m_hCommandPipe;
       isPersistent = true;
   } else {
       hPipe = FileOpen(targetPipe, FILE_READ|FILE_WRITE|FILE_BIN|FILE_SHARE_READ|FILE_SHARE_WRITE);
   }
   
   if(hPipe != INVALID_HANDLE) {
      uchar buffer[];
      StringToCharArray(payload, buffer, 0, WHOLE_ARRAY, CP_UTF8);
      int len = ArraySize(buffer);
      if (len > 0 && buffer[len-1] == 0) len--; 
       uint written = FileWriteArray(hPipe, buffer, 0, len);
       FileFlush(hPipe);
       
       if ((int)written != len) {
           if (isPersistent) {
               Print("[Pipe] Persistent Write BROKEN (Written=",written,"/",len,"). Resetting connection.");
               FileClose(m_hCommandPipe);
               m_hCommandPipe = INVALID_HANDLE;
               m_state = APP_STATE_DISCONNECTED;
           } else {
               FileClose(hPipe);
           }
           return false;
       }
      
      if (!waitForResponse) {
          if (!isPersistent) FileClose(hPipe);
          return true;
      }
      
      string accumulatedResponse = "";
      int attempts = 0;
      
      // READ UNTIL NEWLINE (Line-Delimited Protocol)
      while(attempts < 500) 
      {
         // Wait for data? MQL blocking read? 
         // If persistent, we might contend with ReadCommandPipe?
         // Actually, if we just wrote a request (POLL), the response should come immediately.
         // BUT if ReadCommandPipe runs in OnTick, and we are in OnTick... we are the same thread. Safe.
         
         if(!FileIsEnding(hPipe)) {
            uchar chunk[]; ArrayResize(chunk, 4096); 
            int readCallback = FileReadArray(hPipe, chunk);
            if (readCallback > 0) {
               string part = CharArrayToString(chunk, 0, readCallback, CP_UTF8);
               accumulatedResponse += part;
               
               if (StringFind(accumulatedResponse, "\n") >= 0) break;
            }
         }
         Sleep(1); attempts++; 
      }
      
      if (StringLen(accumulatedResponse) > 0 && StringFind(accumulatedResponse, "\n") < 0) {
          Print("[Pipe] WARNING: Read Timeout (500ms) without Newline. Data TRUNCATED! Len=", StringLen(accumulatedResponse));
      }
      
      response = accumulatedResponse;
      
      // VERBOSE DEBUG: Print EVERYTHING received
      if (response != "" && StringFind(response, "NO_OP") == -1) 
          Print("[Pipe] RX Raw (Len=", StringLen(response), "): ", response);
          
      if (!isPersistent) FileClose(hPipe);
      return true;
   }
   return false;
}

bool CAppClient::SendToPipe(string message) { string dummy; return SendToPipe(message, dummy); }
void CAppClient::SetSymbol(string symbol) { m_symbol = symbol; }

bool CAppClient::SendHeartbeat() {
    CJAVal content; content["mt5_alive"] = true;
    return SendMessage("STATUS_HEARTBEAT", content, "", false);
}

bool CAppClient::SendStatusUpdate() {
   CJAVal content; 
   
   // Account Info
   CJAVal accountObj; 
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
   content["account"].Set(accountObj);
   
   // Expert Info
   CJAVal expertObj; 
   expertObj["active"] = true; 
   expertObj["allowed"] = (bool)MQLInfoInteger(MQL_TRADE_ALLOWED);
   content["expert"].Set(expertObj);
   
   return SendMessage("STATUS_UPDATE", content, "", false);
}

// Pass-throughs
bool CAppClient::SendNewTradeSignal(string strategy, string direction, string messageText, datetime signalTime) {
   CJAVal content; content["strategy"] = strategy; content["direction"] = direction; content["description"] = messageText; content["signalTime"] = (long)signalTime;
   return SendMessage("NewTradeSignal", content);
}
bool CAppClient::SendReplicationTrade(CJAVal &tradeData) { return SendMessage("ReplicateTrade", tradeData); }
bool CAppClient::SendSetup(string strategy, string status, string details) {
   CJAVal content; content["strategy"] = strategy; content["status"] = status; content["description"] = details;
   return SendMessage("TradingSetup", content);
}
bool CAppClient::SendCondition(string name, string value) {
   CJAVal content; content["name"] = name; content["value"] = value;
   return SendMessage("MarketCondition", content);
}
void CAppClient::SendAvailableSymbols() {} // stub