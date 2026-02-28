//+------------------------------------------------------------------+
//|                                              ICommandHandler.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property link      "https://www.mql5.com"
#property strict

#include <JAson.mqh>

//+------------------------------------------------------------------+
//| Interface ICommandHandler                                        |
//| Defines the contract for processing commands and returning Raw   |
//| Data (CJAVal). The transport layer handles the Envelope.         |
//+------------------------------------------------------------------+
class ICommandHandler
{
public:
   // Returns true if command was found and executed.
   // Populates resultPayload with the DATA to be sent back.
   virtual bool Dispatch(string command, CJAVal &payload, CJAVal &resultPayload) = 0;
};
