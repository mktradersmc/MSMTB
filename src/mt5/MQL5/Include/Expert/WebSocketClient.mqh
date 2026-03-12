//+------------------------------------------------------------------+
//|                                              WebSocketClient.mqh |
//|                                  Antigravity Agentic Integration |
//|                               Native AOT Bridge (Multi-Socket)   |
//+------------------------------------------------------------------+
#property copyright "Antigravity Agentic Integration"
#property strict

#ifndef WEBSOCKET_CLIENT_MQH
#define WEBSOCKET_CLIENT_MQH

#include <JAson.mqh>
#include <ICommandHandler.mqh>

//+------------------------------------------------------------------+
//| DLL Imports (Updated for Handle Support)                         |
//+------------------------------------------------------------------+
#import "MT5WebBridge.dll" 
   int    WS_Init(string url, string botId); // Returns Handle (int)
   void   WS_Send(int handle, string method, string payload);
   void   WS_SendBin(int handle, ushort &data[], int size);
   int    WS_GetNext(int handle, ushort &buffer[], int bufferSize);
   void   WS_Cleanup(int handle);
   int    WS_IsConnected(int handle);
#import

//+------------------------------------------------------------------+
//| CWebSocketClient Class                                           |
//+------------------------------------------------------------------+
class CWebSocketClient
{
private:
   int               m_handle; // Connection Handle
   bool              m_connected;
   string            m_botId;
   string            m_function; // Identity Function
   string            m_symbol;   // Identity Symbol
   ushort            m_rx_buffer[];
   
   ulong             m_lastRxTime;
   bool              m_isRegistered;

   void              SendRegister();

public:
                     CWebSocketClient();
                    ~CWebSocketClient();

   bool              Connect(string url, string botId, string func, string sym);
   void              Disconnect();
   bool              IsConnected();
   
   void              OnTimer(); // NEW: Called by Expert OnTimer
   
   bool              Send(string method, string payload);
   bool              SendRaw(string json); 
   bool              SendProtocolMessage(string command, CJAVal &payload, string requestId=""); // NEW: Strict Envelope
   bool              SendBinary(ushort &data[], int size); 
   bool              SendBinaryWithHeader(string command, CJAVal &payload, const uchar &binaryData[], string requestId=""); // NEW: Binary Framing
   bool              GetNextMessage(string &outMessage);
   
   string            GetBotId() { return m_botId; } 

   // STRICT PROTOCOL ENFORCER
   void              RegisterCommandHandler(ICommandHandler* handler) { m_commandHandler = handler; }
   void              Process();

private:
   ICommandHandler*  m_commandHandler;
   string            FormatResponseEnvelope(string cmd, CJAVal &payload, string reqId, string status);
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CWebSocketClient::CWebSocketClient()
{
   m_handle = 0;
   m_connected = false;
   m_botId = "";
   m_symbol = "";
   m_lastRxTime = 0;
   m_isRegistered = false;
   ArrayResize(m_rx_buffer, 5242880); // 5MB Buffer 
}

//+------------------------------------------------------------------+
//| Destructor                                                       |
//+------------------------------------------------------------------+
CWebSocketClient::~CWebSocketClient()
{
   Disconnect();
}

//+------------------------------------------------------------------+
//| Connect                                                          |
//+------------------------------------------------------------------+
bool CWebSocketClient::Connect(string url, string botId, string func, string sym)
{
   if(m_connected) Disconnect();
   
   int h = WS_Init(url, botId);
   if(h > 0) {
      m_handle = h;
      m_connected = true;
      m_botId = botId;
      m_function = func;
      m_symbol = sym;
      m_lastRxTime = GetTickCount64(); // Reset timeout timer
      m_isRegistered = false;
      
      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Disconnect                                                       |
//+------------------------------------------------------------------+
void CWebSocketClient::Disconnect()
{
   if(m_connected && m_handle > 0) {
      WS_Cleanup(m_handle);
      m_connected = false;
      m_handle = 0;
      m_isRegistered = false;
      Print("[WebSocketClient] Disconnected.");
   }
}

//+------------------------------------------------------------------+
//| IsConnected                                                      |
//+------------------------------------------------------------------+
bool CWebSocketClient::IsConnected()
{
   if(!m_connected || m_handle <= 0) return false;
   if(WS_IsConnected(m_handle) == 0) {
      Disconnect();
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| OnTimer (Called every 100ms by Expert)                           |
//+------------------------------------------------------------------+
void CWebSocketClient::OnTimer()
{
   if(!IsConnected()) {
       m_isRegistered = false;
       return;
   }

   ulong now = GetTickCount64();

   // 1. Registration State Machine
   // Only send REGISTER if we are connected but not yet registered.
   if (!m_isRegistered) {
       SendRegister(); 
   }

   // 2. Standard Heartbeat (1s)
   static ulong lastHeartbeat = 0;
   if (now - lastHeartbeat >= 1000) {
       CJAVal payload;
       payload["mt5_alive"] = true;
       SendProtocolMessage("HEARTBEAT", payload);
       lastHeartbeat = now;
   }
}

//+------------------------------------------------------------------+
//| Send                                                             |
//+------------------------------------------------------------------+
bool CWebSocketClient::Send(string method, string payload)
{
   if(!m_connected || m_handle <= 0) return false;
   WS_Send(m_handle, method, payload);
   return true;
}

bool CWebSocketClient::SendRaw(string json)
{
   if(!m_connected || m_handle <= 0) return false;
   
   // Tunneling via "RAW" method to allow backend to unwrap.
   // Backend must look for method="RAW" and treat payload as the full message.
   WS_Send(m_handle, "RAW", json);
   return true;
}

//+------------------------------------------------------------------+
//| SendProtocolMessage (Strict Envelope Builder)                    |
//+------------------------------------------------------------------+
bool CWebSocketClient::SendProtocolMessage(string command, CJAVal &payload, string requestId="")
{
   if(!m_connected || m_handle <= 0) return false;

   // Enforce Universal Binary Framing: 
   // We will pass the command, payload, and an empty binary array to SendBinaryWithHeader, 
   // which manages the packet struct: [4 byte JSON Length][JSON Bytes][Binary Bytes]
   uchar emptyBinaryPayload[];
   return SendBinaryWithHeader(command, payload, emptyBinaryPayload, requestId);
}

//+------------------------------------------------------------------+
//| SendBinary                                                       |
//+------------------------------------------------------------------+
bool CWebSocketClient::SendBinary(ushort &data[], int size)
{
   if(!m_connected || m_handle <= 0) return false;
   WS_SendBin(m_handle, data, size);
   return true;
}

//+------------------------------------------------------------------+
//| SendBinaryWithHeader (Binary Framing Protocol)                   |
//+------------------------------------------------------------------+
bool CWebSocketClient::SendBinaryWithHeader(string command, CJAVal &payload, const uchar &binaryData[], string requestId="")
{
   if(!m_connected || m_handle <= 0) return false;

   // 1. Build Metadata Header (JSON)
   CJAVal envelope;
   envelope["header"]["command"] = command;
   envelope["header"]["botId"] = m_botId;       
   envelope["header"]["func"] = m_function;     
   envelope["header"]["symbol"] = m_symbol;     
   envelope["header"]["timestamp"] = (long)TimeCurrent();
   
   if (requestId != "") {
       envelope["header"]["request_id"] = requestId;
   }
   envelope["payload"].Set(&payload);
   
   string jsonStr = envelope.Serialize();
   
   // 2. Convert JSON String to Bytes (UTF-8, without Null Terminator)
   uchar jsonBytes[];
   int jsonLen = StringToCharArray(jsonStr, jsonBytes, 0, WHOLE_ARRAY, CP_UTF8) - 1; // -1 to drop null terminator
   
   int payloadLen = ArraySize(binaryData);
   
   // 3. Assemble Final Buffer: [4 Byte Length] + [JSON Bytes] + [Binary Payload]
   // Total size = 4 + jsonLen + payloadLen
   int totalSize = 4 + jsonLen + payloadLen;
   uchar finalBuffer[];
   ArrayResize(finalBuffer, totalSize);
   
   // 3.1 Write 4-Byte Int (Little Endian)
   finalBuffer[0] = (uchar)(jsonLen & 0xFF);
   finalBuffer[1] = (uchar)((jsonLen >> 8) & 0xFF);
   finalBuffer[2] = (uchar)((jsonLen >> 16) & 0xFF);
   finalBuffer[3] = (uchar)((jsonLen >> 24) & 0xFF);
   
   // 3.2 Write JSON Bytes
   ArrayCopy(finalBuffer, jsonBytes, 4, 0, jsonLen);
   
   // 3.3 Write Binary Payload
   ArrayCopy(finalBuffer, binaryData, 4 + jsonLen, 0, payloadLen);
   
   // 4. Send using WS_SendBin
   // C# bridge expects ushort[] because of legacy reasons in the wrapper,
   // but DLL takes pointers. We can cast uchar[] to ushort[] by lying about size,
   // or just use WS_SendBin natively if the DLL supports it.
   // WAIT: WS_SendBin takes (ushort &data[], int size) where size is bytes.
   // We must create a temporary ushort array that overlays the uchar memory.
   
   int ushortElements = (totalSize + 1) / 2;
   ushort sendBuffer[];
   ArrayResize(sendBuffer, ushortElements);
   // Clean buffer
   ArrayInitialize(sendBuffer, 0);
   
   // Copy raw bytes into ushort array (Memory copy is clean in MQL5)
   for(int i = 0; i < totalSize; i++) {
       int ushortIdx = i / 2;
       if (i % 2 == 0) {
           sendBuffer[ushortIdx] |= finalBuffer[i]; // Lower byte
       } else {
           sendBuffer[ushortIdx] |= (finalBuffer[i] << 8); // Upper byte
       }
   }
   
   WS_SendBin(m_handle, sendBuffer, totalSize);
   return true;
}

//+------------------------------------------------------------------+
//| GetNextMessage                                                   |
//+------------------------------------------------------------------+
bool CWebSocketClient::GetNextMessage(string &outMessage)
{
   if(!m_connected || m_handle <= 0) return false;
   
   // Pass buffer to DLL
   int bufferSizeInBytes = ArraySize(m_rx_buffer) * 2;
   int res = WS_GetNext(m_handle, m_rx_buffer, bufferSizeInBytes);
   
   if (res > 0) {
       m_lastRxTime = GetTickCount64(); // Update Activity
       outMessage = ShortArrayToString(m_rx_buffer); 
       return true;
   }
   
   if (res < 0) {
      if (res != -1) { // -1 usually means "no message", only log real errors
          Print("[WS] WS_GetNext Error Code: ", res);
          Disconnect();
      }
   }
   
   return false;
}

//+------------------------------------------------------------------+
//| SendRegister (Private)                                           |
//+------------------------------------------------------------------+
void CWebSocketClient::SendRegister()
{
   if(!m_connected) return;
   Print("Sending Register");
   CJAVal payload;
   // Payload is empty for Register in V3 (Header has metadata)
   
   // Send Protocol Message (Header Auto-Filled)
   if (SendProtocolMessage("REGISTER", payload)) {
       m_isRegistered = true;
       Print("[WebSocketClient] 📤 Sent REGISTER: ", m_botId, ":", m_function, ":", m_symbol);
   }
}

//+------------------------------------------------------------------+
//| Process (Strict Protocol Loop)                                   |
//+------------------------------------------------------------------+
void CWebSocketClient::Process()
{
   if(m_handle <= 0 || m_commandHandler == NULL) return;
   
   string message;
   while(GetNextMessage(message))
   {
       // Parse JSON
       CJAVal json(NULL, jtUNDEF);
       if(!json.Deserialize(message)) {
           Print("[WS] ❌ Failed to parse incoming JSON");
           continue; 
       }
       
       if(!json.HasKey("header")) {
           Print("[WS] ⚠️ Dropping message without header");
           continue;
       }
       
       string cmd = json["header"]["command"].ToStr();
       string reqId = json["header"]["request_id"].ToStr();
       CJAVal* payload = json["payload"];
       
       // Dispatch
       CJAVal result(NULL, jtUNDEF);
       uchar binaryPayload[];
       bool success = m_commandHandler.Dispatch(cmd, payload, result, binaryPayload);
       
       if(success) {
           Print("[WS] ✅ Dispatch Success. Formatting Response...");
           // AUTO-WRAP & SEND RESPONSE
           string respCmd = cmd + "_RESPONSE";
           
           // Extract just the payload part of the envelope logic to use in the binary framer
           int binSize = ArraySize(binaryPayload);
           Print("[WS] ✉️ Sending Binary Response (JSON + ", binSize, " bytes) for ", reqId);
           SendBinaryWithHeader(respCmd, result, binaryPayload, reqId);
       } else {
           // ERROR Response
           if(StringFind(cmd, "_RESPONSE") < 0) {
              if(!result.HasKey("message")) { result["message"] = "Unknown Command or Execution Failed"; } 
              uchar emptyBin[];
              SendBinaryWithHeader(cmd + "_RESPONSE", result, emptyBin, reqId);
           }
       }
   }
}

string CWebSocketClient::FormatResponseEnvelope(string cmd, CJAVal &payload, string reqId, string status)
{
   CJAVal envelope;
   envelope["header"]["command"] = cmd;
   envelope["header"]["request_id"] = reqId;
   envelope["header"]["timestamp"] = (long)TimeCurrent();
   envelope["header"]["status"] = status;
   envelope["header"]["status"] = status;
   envelope["header"]["botId"] = m_botId;       // Renamed source -> botId for consistency with User Request
   envelope["header"]["func"] = m_function;     // MANDATORY
   envelope["header"]["symbol"] = m_symbol;     // MANDATORY
   // source is deprecated/alias
   envelope["header"]["source"] = m_botId;
   
   // FIX: Use Set() to correctly assign the object to the "payload" key
   // "Copy" apparently created an anonymous child in some JAson versions.
   envelope["payload"].Set(&payload);
   
   return envelope.Serialize();
}

#endif

