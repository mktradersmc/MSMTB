//+------------------------------------------------------------------+
//|                                              CCommandManager.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property link      "https://www.mql5.com"
#property strict

#ifndef CCOMMAND_MANAGER_MQH
#define CCOMMAND_MANAGER_MQH

#include <JAson.mqh>
#include <Generic\HashMap.mqh>
#include "CBaseCommand.mqh"
#include "ICommandHandler.mqh"


class CCommandManager : public ICommandHandler
{
private:
   CHashMap<string, CBaseCommand*> m_commands;

public:
                     CCommandManager() {}
                    ~CCommandManager() 
                    {
                        // Clean up command objects if needed
                    }

   void Register(string name, CBaseCommand *cmd)
   {
      m_commands.Add(name, cmd);
   }

   // DEPRECATED string Dispatch
   // string Dispatch(CJAVal *request)
   
   // ICommandHandler Implementation
   virtual bool Dispatch(string cmdName, CJAVal &payload, CJAVal &resultPayload)
   {
      // 2. Lookup Command
      CBaseCommand *cmd = NULL;
      if(!m_commands.TryGetValue(cmdName, cmd) || cmd == NULL)
      {
         Print("[CCommandManager] ⚠️ Unknown Command: ", cmdName);
         resultPayload["message"] = "Unknown command: " + cmdName;
         return false;
      }
      
      // 3. Execute
      Print("[CCommandManager] ▶️ Executing: ", cmdName);
      
      if(cmd.Execute(&payload, resultPayload))
      {
         Print("[CCommandManager] ✅ Executed: ", cmdName);
         return true;
      }
      else
      {
         Print("[CCommandManager] ❌ Execution Failed: ", cmdName, " Error: ", cmd.GetError());
         resultPayload["message"] = cmd.GetError();
         return false;
      }
   }
   
   string ErrorResponse(string errorMsg, string reqId)
   {
      CJAVal response;
      
      CJAVal header;
      header["status"] = "ERROR";
      header["request_id"] = reqId;
      header["timestamp"] = (long)TimeCurrent();
      
      response["header"].Set(header);
      response["payload"]["message"] = errorMsg;
      
      return response.Serialize();
   }
   
   string SuccessResponse(string cmdName, string reqId, CJAVal &payload)
   {
      CJAVal response;
      
      CJAVal header;
      header["command"] = cmdName;
      header["status"] = "OK";
      header["request_id"] = reqId;
      header["timestamp"] = (long)TimeCurrent();
      
      response["header"].Set(header);
      response["payload"].Set(payload);
      
      return response.Serialize();
   }
};

#endif

