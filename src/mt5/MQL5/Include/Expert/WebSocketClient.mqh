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

   CJAVal envelope;
   
   // 1. HEADER (Mandatory Fields)
   envelope["header"]["command"] = command;
   envelope["header"]["botId"] = m_botId;       
   envelope["header"]["func"] = m_function;     
   envelope["header"]["symbol"] = m_symbol;     
   envelope["header"]["timestamp"] = (long)TimeCurrent();
   
   // Optional Request ID (Sync only)
   if (requestId != "") {
       envelope["header"]["request_id"] = requestId;
   }

   // 2. PAYLOAD
   envelope["payload"].Set(&payload);

   // 3. SEND RAW
   return SendRaw(envelope.Serialize());
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
       bool success = m_commandHandler.Dispatch(cmd, payload, result);
       
       if(success) {
           Print("[WS] ✅ Dispatch Success. Formatting Response...");
           // AUTO-WRAP & SEND RESPONSE
           // We strict-type the response command name: <CMD>_RESPONSE
           string respCmd = cmd + "_RESPONSE";
           
           string envelope = FormatResponseEnvelope(respCmd, result, reqId, "OK");
           Print("[WS] ✉️ Sending Raw Response (Len: ", StringLen(envelope), ") for ", reqId);
           SendRaw(envelope);
           // Print("[WS] ↩️ Auto-Responded to ", cmd, " (ID: ", reqId, ")");
       } else {
           // Optional: Send ERROR response?
           if(StringFind(cmd, "_RESPONSE") < 0) {
              // It was a Request, but failed. Send Error.
              if(!result.HasKey("message")) { result["message"] = "Unknown Command or Execution Failed"; } string envelope = FormatResponseEnvelope(cmd + "_RESPONSE", result, reqId, "ERROR");
              SendRaw(envelope);
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

