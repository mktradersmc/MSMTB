//+------------------------------------------------------------------+
//|                                                    CSyncData.mqh |
//|                                   Copyright 2026, Michael Mueller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Michael Mueller"
#property strict

#include "..\CBaseCommand.mqh"
#include <JAson.mqh>

// Forward Declaration of Service/Function logic?
// TickSpy is not yet a Class Service. It's a procedural Indicator.
// Options:
// 1. Refactor TickSpy to a Class (CTickSpyService).
// 2. Pass function pointers? (MQL5 supports limited function pointers)
// 3. Command executes logic directly? (Needs access to globals)

// BEST PRACTICE: Refactor TickSpy logic into a class CTickSpyService.
// I will assume CTickSpyService exists or will be created.

#include "..\Indicators\TickSpyService.mqh"

class CSyncData : public CBaseCommand
{
private:
   CTickSpyService* m_service;
public:
   CSyncData(CTickSpyService* service) { m_service = service; }
   
   virtual string Name() { return "CMD_START_SYNCHRONIZED_UPDATE"; }
   
   virtual bool Execute(CJAVal *payload, CJAVal &responsePayload)
   {
      if(m_service == NULL) return false;
      
      // Delegate to Service and pass Response object for population
      return m_service.ProcessStartSynchronizedUpdate(payload, responsePayload);
   }
};
