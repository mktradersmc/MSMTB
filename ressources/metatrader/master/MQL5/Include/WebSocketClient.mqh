//+------------------------------------------------------------------+
//|                                             WebSocketClient.mqh |
//|                                  Antigravity Agentic Integration |
//|                                       C# DLL Wrapper Support     |
//+------------------------------------------------------------------+
#property copyright "Antigravity Agentic Integration"
#property strict

#include <JAson.mqh>
#include "ICommandHandler.mqh"

// ------------------------------------------------------------------
// DLL Imports (C# DllExport)
// ------------------------------------------------------------------
#import "MT5WebSocketBridge.dll"
   int  WS_Init(string url, string botId);
   int  WS_Send(int handle, string message);
   int  WS_GetMessage(int handle, uchar &buffer[], int bufferSize);
   int  WS_IsConnected(int handle);
   void WS_Cleanup(int handle);
#import

// ------------------------------------------------------------------
// MQL5 Wrapper Class
// ------------------------------------------------------------------
class CWebSocketClient
{
private:
   int               m_handle;
   string            m_botId;
   string            m_url;
   
   // Buffer for receiving messages (1MB)
   uchar             m_rx_buffer[];
   const int         RX_BUFFER_SIZE;

public:
                     CWebSocketClient();
                    ~CWebSocketClient();

   // Lifecycle
   bool              Connect(string url, string botId);
   void              Disconnect();
   bool              IsConnected();
   
   // Communication
   // Communication
   bool              Send(string method, string payload);
   bool              SendRaw(string json);
   bool              GetNextMessage(string &outMessage);
   
   // Dispatcher
   void              RegisterCommandHandler(ICommandHandler* handler);
   void              Process(); // Pulls messages, Dispatches, Auto-Responds

   // Helper: Generates Standard Envelope
   string            FormatEnvelope(string method, string payload, string id);
   string            FormatResponseEnvelope(string method, CJAVal &resultPayload, string id, string status); // Strict Response

private:
   string            CharArrayToString(uchar &arr[], int len);
   ICommandHandler*  m_commandHandler;
};

//+------------------------------------------------------------------+
//| Constructor                                                      |
//+------------------------------------------------------------------+
CWebSocketClient::CWebSocketClient() : m_handle(-1), RX_BUFFER_SIZE(1024 * 1024), m_commandHandler(NULL)
{
   ArrayResize(m_rx_buffer, RX_BUFFER_SIZE);
}

//+------------------------------------------------------------------+
//| RegisterCommandHandler                                           |
//+------------------------------------------------------------------+
void CWebSocketClient::RegisterCommandHandler(ICommandHandler* handler)
{
   m_commandHandler = handler;
}

//+------------------------------------------------------------------+
//| Process (The Strict Protocol Loop)                               |
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
           // AUTO-WRAP & SEND RESPONSE
           // We strict-type the response command name: <CMD>_RESPONSE
           string respCmd = cmd + "_RESPONSE";
           
           // If the handler ALREADY suffixed it (legacy compat), check?
           // No, we force strict naming in the wrapper.
           
           string envelope = FormatResponseEnvelope(respCmd, result, reqId, "OK");
           SendRaw(envelope);
           // Print("[WS] ↩️ Auto-Responded to ", cmd, " (ID: ", reqId, ")");
       } else {
           // Optional: Send ERROR response?
           // For now, silent drop or check if it was a RESPONSE (RPC Return)
           // If cmd ends in _RESPONSE, Dispatch might have returned false?
           // Commands usually return true.
           
           if(StringFind(cmd, "_RESPONSE") < 0) {
              // It was a Request, but failed. Send Error.
              CJAVal error;
              error["message"] = "Unknown Command or Execution Failed";
              string envelope = FormatResponseEnvelope(cmd + "_RESPONSE", error, reqId, "ERROR");
              SendRaw(envelope);
           }
       }
   }
}

//+------------------------------------------------------------------+
//| Helper: Format Response Envelope (Strict)                        |
//+------------------------------------------------------------------+
string CWebSocketClient::FormatResponseEnvelope(string method, CJAVal &resultPayload, string id, string status)
{
   // Strict JSON Construction
   CJAVal envelope;
   
   CJAVal header;
   header["command"] = method;
   header["request_id"] = id;
   header["status"] = status;
   header["timestamp"] = (long)TimeCurrent();
   // header["bot_id"] = m_botId; // Optional: Redundant if sender is in payload? No, sender is outside.
   
   envelope["header"].Set(header);
   // payload is ALREADY a CJAVal object, so Set works (Copy)
   envelope["payload"].Set(resultPayload);
   
   return envelope.Serialize();
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
bool CWebSocketClient::Connect(string url, string botId)
{
   Disconnect();
   m_url = url;
   m_botId = botId;
   
   // blocking call to C# Init (Async wait inside DLL)
   m_handle = WS_Init(url, botId);
   
   if(m_handle > 0)
   {
      PrintFormat("[WS] Connected to %s (Handle: %d)", url, m_handle);
      return true;
   }
   
   PrintFormat("[WS] Failed to connect to %s", url);
   return false;
}

//+------------------------------------------------------------------+
//| Disconnect                                                       |
//+------------------------------------------------------------------+
void CWebSocketClient::Disconnect()
{
   if(m_handle > 0)
   {
      WS_Cleanup(m_handle);
      m_handle = -1;
   }
}

//+------------------------------------------------------------------+
//| IsConnected                                                      |
//+------------------------------------------------------------------+
bool CWebSocketClient::IsConnected()
{
   if(m_handle <= 0) return false;
   return (bool)WS_IsConnected(m_handle);
}

//+------------------------------------------------------------------+
//| Send (JSON)                                                      |
//+------------------------------------------------------------------+
bool CWebSocketClient::Send(string method, string payload)
{
   if(m_handle <= 0) return false;
   
   // Format Envelope
   // ID could be auto-generated here or passed in for RPC
   string envelope = FormatEnvelope(method, payload, "");
   
   int res = WS_Send(m_handle, envelope);
   return (res == 1);
}

//+------------------------------------------------------------------+
//| SendRaw (Bypass Envelope)                                        |
//+------------------------------------------------------------------+
bool CWebSocketClient::SendRaw(string json)
{
   if(m_handle <= 0) return false;
   int res = WS_Send(m_handle, json);
   return (res == 1);
}

//+------------------------------------------------------------------+
//| GetNextMessage                                                   |
//+------------------------------------------------------------------+
bool CWebSocketClient::GetNextMessage(string &outMessage)
{
   if(m_handle <= 0) return false;
   
   ArrayFill(m_rx_buffer, 0, RX_BUFFER_SIZE, 0);
   
   int len = WS_GetMessage(m_handle, m_rx_buffer, RX_BUFFER_SIZE);
   
   if(len > 0)
   {
      outMessage = CharArrayToString(m_rx_buffer, len);
      return true;
   }
   
   return false;
}

//+------------------------------------------------------------------+
//| Helper: Format Envelope                                          |
//+------------------------------------------------------------------+
string CWebSocketClient::FormatEnvelope(string method, string payload, string id)
{
   // In C++, we might use a JSON lib, here we format string manually for speed/simplicity
   // Envelope: { "id": "...", "method": "...", "payload": ... }
   // Assuming payload is ALREADY valid JSON object/string or primitive
   
   string json = StringFormat(
      "{\"id\":\"%s\",\"method\":\"%s\",\"payload\":%s,\"sender\":\"%s\"}",
      id, method, payload, m_botId
   );
   return json;
}

//+------------------------------------------------------------------+
//| Helper: Convert Char Array to String                             |
//+------------------------------------------------------------------+
string CWebSocketClient::CharArrayToString(uchar &arr[], int len)
{
   return ::CharArrayToString(arr, 0, len, CP_UTF8);
}
