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
    
    string m_exchangePath;      
    long   m_lastCommandTimestamp; 
    long   m_lastOutputFileSize;   
    
    // Pipe State
    string m_privatePipeName;
    AppConnectionState m_state;
    string m_timezoneSignature; 

    // Command Handler
    ICommandHandler* m_commandHandler;
    
    CAppClient(); 
    void ParseConfigLine(string line);
    bool UpdateMessageStatus(string messageId, bool isActive);
    
    // Internal File Methods
    bool SendMessageToFile(CJAVal& body);
    int GetMessagesFromFile(CJAVal &messagesArray);
    
    // Pipe Method
    bool SendToPipe(string message, string &response, string pipeName, bool waitForResponse=true);
    bool SendToPipe(string message, string &response);
    bool SendToPipe(string message);
    
    // Connection Logic
    void CheckConnection();
    bool RegisterBot();
    
    // Domain logic for messages
    void ProcessIncomingMessages(CJAVal &messages);
    void ProcessSingleMessage(CJAVal &msg);

public:
    static CAppClient* GetInstance();
    
    void SetCommandHandler(ICommandHandler* handler) { m_commandHandler = handler; }
    string GetBotId() { return m_botId; }
    void SetTimezoneSignature(string sig) { m_timezoneSignature = sig; }
    
    bool SendMessage(string type, CJAVal& content, string symbol = "", bool waitForResponse = true);
    bool ProcessMessages();
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
    m_pollIntervalMs = 1000; 
    
    if (!LoadConfig()) {
        Print("Failed to load configuration. Please check bot_properties.txt file.");
    }
    
    m_symbol = _Symbol;
    m_lastTimestamp = 0;
    m_errorPrinted = false;
    m_lastPollTime = 0;
    m_lastHeartbeatTime = 0;
    m_timezoneSignature = "EET"; 
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
    if (type != "TICK_DATA" && type != "STATUS_HEARTBEAT") Print("[Pipe] Sending message: ", type);
    
    // Special Routing for Heartbeat
    if (type == "STATUS_HEARTBEAT") {
        string response;
        // Heartbeats are now Fire-and-Forget by default via waitForResponse=false
        if (!waitForResponse) {
             return SendToPipe(body.Serialize(), response, PIPE_HEARTBEAT_NAME, false); 
        }
        bool res = SendToPipe(body.Serialize(), response, PIPE_HEARTBEAT_NAME, true);
        if (!res) Print("[Bot] Failed to send Heartbeat.");
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
             int h = FileOpen(pipeName, FILE_READ|FILE_WRITE|FILE_BIN);
             if (h != INVALID_HANDLE) {
                 FileClose(h);
                 Print("[AppClient:Conn] Private Pipe Found: ", pipeName);
                 m_privatePipeName = pipeName;
                 m_state = APP_STATE_CONNECTED;
             }
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
    
    CJAVal messagesArray;
    int count = GetMessages(messagesArray); 
    return (count >= 0);
}

void CAppClient::ProcessIncomingMessages(CJAVal &messages)
{
    if (messages.m_type == jtARRAY) {
        int count = messages.Size();
        for(int i = 0; i < count; i++) { CJAVal *msgPtr = messages[i]; if(msgPtr != NULL) ProcessSingleMessage(*msgPtr); }
    }
    else if (messages.m_type == jtOBJ) ProcessSingleMessage(messages);
}

void CAppClient::ProcessSingleMessage(CJAVal &msg)
{
    CJAVal *timeVal = msg.HasKey("timestamp");
    if (timeVal != NULL)
    {
        long ts = StringToInteger(timeVal.ToStr());
        if (ts <= m_lastTimestamp && m_communicationMode != "FILE") return; 
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

    string type = msg.HasKey("type") ? msg["type"].ToStr() : "";
    string sender = msg.HasKey("sender") ? msg["sender"].ToStr() : "";
    
    // VERBOSE LOGGING: Inspect every single message (after targeting check)
    Print("[AppClient] Processing Msg: Type=", type, " Sender=", sender, " JSON=", msg.Serialize());
    
    // FORENSIC TRACE
    if (msg.HasKey("customId")) {
        string cid = msg["customId"].ToStr();
        if (StringFind(cid, "TRC-") >= 0) {
             Print("[Forensic] ", cid, " | 5. Bot Process | Type=", type);
        }
    }
    
    // Fix: Allow EXECUTE_TRADE to pass through even without CMD_ prefix
    if (StringFind(type, "CMD_") == 0 || type == "EXECUTE_TRADE") {
        long cmdTs = msg.HasKey("timestamp") ? StringToInteger(msg["timestamp"].ToStr()) : 0;
        if (cmdTs > m_lastCommandTimestamp) {
            if (m_commandHandler != NULL) m_commandHandler.HandleCommand(type, msg);
            m_lastCommandTimestamp = cmdTs;
        }
        return;
    }

    if(sender == "App") {
        CJAVal *symbolVal = msg.HasKey("symbol");
        string msgSymbol = (symbolVal != NULL) ? symbolVal.ToStr() : "*";
        bool isForMe = (msgSymbol == "*" || msgSymbol == CEnvironmentManager::GetInstance().GetNormalizedSymbol(_Symbol));

        if (isForMe) {
            Print("RAW MSG: ", msg.Serialize()); 
            
            CJAVal* content = msg["content"];
            if (content != NULL) {
                 CJAVal* dryRunPtr = (*content)["dryRun"];
                 if (dryRunPtr != NULL && dryRunPtr.ToBool()) {
                     Print("=== DRY RUN MODE: Message Intercepted & Blocked ===");
                     CJAVal *idVal = msg.HasKey("id");
                     if(idVal != NULL) UpdateMessageStatus(idVal.ToStr(), false); 
                     return; 
                 }
            }

            CJAVal *idVal = msg.HasKey("id");
            if(idVal != NULL) UpdateMessageStatus(idVal.ToStr(), false);
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
               if (line == "") continue;
               
               CJAVal json;
               if (json.Deserialize(line)) { 
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
                    messagesArray.Add(*(item.m_val));
                    ProcessIncomingMessages(*(item.m_val));
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
   int hPipe = FileOpen(targetPipe, FILE_READ|FILE_WRITE|FILE_BIN|FILE_SHARE_READ|FILE_SHARE_WRITE);
   
   if(hPipe != INVALID_HANDLE) {
      uchar buffer[];
      StringToCharArray(payload, buffer, 0, WHOLE_ARRAY, CP_UTF8);
      int len = ArraySize(buffer);
      if (len > 0 && buffer[len-1] == 0) len--; 
      FileWriteArray(hPipe, buffer, 0, len);
      FileFlush(hPipe);
      
      if (!waitForResponse) {
          FileClose(hPipe);
          return true;
      }
      
      string accumulatedResponse = "";
      int attempts = 0;
      while(attempts < 25) // Increased to ~25-30ms to allow Node.js DB query time
      {
         if(!FileIsEnding(hPipe)) {
            uchar chunk[]; ArrayResize(chunk, 4096); 
            int readCallback = FileReadArray(hPipe, chunk);
            if (readCallback > 0) {
               ArrayResize(chunk, readCallback);
               accumulatedResponse += CharArrayToString(chunk, 0, WHOLE_ARRAY, CP_UTF8);
            }
         } else { if (StringLen(accumulatedResponse) > 0) break; }
         if (StringLen(accumulatedResponse) > 0 && attempts > 2) break; 
         Sleep(1); attempts++; 
      }
      response = accumulatedResponse;
      
      // VERBOSE DEBUG: Print EVERYTHING received
      if (response != "") 
          Print("[Pipe] RX Raw: ", response);
          
      FileClose(hPipe);
      return true;
   }
   return false;
}

bool CAppClient::SendToPipe(string message) { string dummy; return SendToPipe(message, dummy); }
void CAppClient::SetSymbol(string symbol) { m_symbol = symbol; }

bool CAppClient::SendHeartbeat() {
   CJAVal content; content["mt5_alive"] = true;
   CJAVal accountObj; accountObj["login"] = (long)AccountInfoInteger(ACCOUNT_LOGIN);
   accountObj["connected"] = (bool)TerminalInfoInteger(TERMINAL_CONNECTED);
   accountObj["trade_allowed"] = (bool)AccountInfoInteger(ACCOUNT_TRADE_ALLOWED);
   accountObj["equity"] = AccountInfoDouble(ACCOUNT_EQUITY);
   accountObj["balance"] = AccountInfoDouble(ACCOUNT_BALANCE);
   content["account"].Set(accountObj);
   
   CJAVal expertObj; expertObj["active"] = true; expertObj["allowed"] = (bool)MQLInfoInteger(MQL_TRADE_ALLOWED);
   content["expert"].Set(expertObj);
   content["expert"].Set(expertObj);
   return SendMessage("STATUS_HEARTBEAT", content, "", false);
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
