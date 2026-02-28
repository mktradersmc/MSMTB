//+------------------------------------------------------------------+
//|                                              CShutdownCommand.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property strict

#include "..\CBaseCommand.mqh"
#include <JAson.mqh>

class CShutdownCommand : public CBaseCommand
{
public:
   CShutdownCommand() {}
   
   virtual string Name() { return "CMD_SHUTDOWN"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
       Print("[CShutdownCommand] 🛑 CMD_SHUTDOWN Received! Shutting down terminal.");
       
       responsePayload["status"] = "OK";
       responsePayload["message"] = "Shutting down";
       
       // Call TerminalClose to gracefully exit the Mt5 terminal process
       TerminalClose(0);
       
       return true; 
   }
};
