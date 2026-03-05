//+------------------------------------------------------------------+
//|                                                  SanityCheck.mqh |
//|                                  Copyright 2026, MetaQuotes Ltd. |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, MetaQuotes Ltd."
#property strict

#ifndef SANITY_CHECK_MQH
#define SANITY_CHECK_MQH

#include "..\JAson.mqh"
// Note: We do NOT include AppClient here to allow usage in DatafeedExpert
// Forward declaration if needed, or Duck Type via GetInstance in Run()

class CSanityCheck
{
public:
   // Generic Diagnostics Collector
   static CJAVal GetDiagnostics()
   {
       CJAVal content;
       
       // 1. Connection Checks
       content["connected"] = (bool)TerminalInfoInteger(TERMINAL_CONNECTED);
       content["trade_allowed"] = (bool)AccountInfoInteger(ACCOUNT_TRADE_ALLOWED);
       content["dlls_allowed"] = (bool)TerminalInfoInteger(TERMINAL_DLLS_ALLOWED);
       content["expert_enabled"] = (bool)TerminalInfoInteger(TERMINAL_TRADE_ALLOWED);
       
       // 2. Account Info
       content["account_login"] = (long)AccountInfoInteger(ACCOUNT_LOGIN);
       content["account_server"] = AccountInfoString(ACCOUNT_SERVER);
       content["equity"] = AccountInfoDouble(ACCOUNT_EQUITY);
       content["balance"] = AccountInfoDouble(ACCOUNT_BALANCE);
       
       // 3. Time Info
       content["terminal_time"] = (long)TimeCurrent();
       content["local_time"] = (long)TimeLocal();
       content["gmt_offset"] = (int)((TimeCurrent() - TimeGMT()) / 3600); // Rough check
       
       // 4. Memory/Error Info
       content["last_error"] = (long)GetLastError();
       content["memory_free"] = (long)TerminalInfoInteger(TERMINAL_MEMORY_AVAILABLE);
       
       return content;
   }

   // Convenience for AwesomeExpert (uses CAppClient)
   static void Run()
   {
       // Assumes CAppClient is available in the compilation unit
       // We use dynamic resolution or assume usage in CAwesomeExpert context
       // Since CAppClient is a singleton, we can't easily forward declare it cleanly without including.
       // BUT AwesomeExpert includes AppClient.mqh BEFORE SanityCheck.mqh.
       // So CAppClient class is known.
       
       CJAVal content = GetDiagnostics();
       
       // Using the global/singleton accessible CAppClient
       // Note: To compile this file standalone, it would fail. 
       // It must be included where CAppClient is known.
       // Alternatively, pass sender as callback? No, simpler to just rely on Context.
       
       // Since we can't strictly rely on CAppClient::GetInstance() being visible without include,
       // we will trust the Compiler if AppClient.mqh is included beforehand.
       // However, to make it safer, let's look for the method signature.
       
       // Ideally:
       // CAppClient::GetInstance().SendMessage("SANITY_RESPONSE", content);
       
       // For now, we will assume generic usage and if CAppClient isn't found, 
       // the user of this class (AwesomeExpert) should call GetDiagnostics() and send it themselves.
       // BUT I already wrote AwesomeExpert to call Run().
       // So I must include AppClient OR assume it exists. 
       // Let's assume usage pattern: #include <Expert/AppClient.mqh> then #include <Services/SanityCheck.mqh>
       
       // Hack for now:
       // We will NOT implement Run() here if it depends on AppClient to avoiding circular refs or missing refs 
       // if used in DatafeedExpert.
       // Wait, I updated AwesomeExpert to call CSanityCheck::Run(). I MUST implement it.
       // I'll add a #ifdef or just include AppClient guardedly?
       
       // Better: AwesomeExpert already included AppClient.
       // So I can use CAppClient::GetInstance() here? 
       // Only if the compiler sees the definition.
   }
};

// Moving Run() to AwesomeExpert logic would have been cleaner, but let's implement the Payload generator here at least.
// I will revert the Run() call in AwesomeExpert if I can, OR I will just implement GetDiagnostics
// and let AwesomeExpert call That + SendMessage.
// BUT I already committed the MultiReplace for AwesomeExpert calling Run().
// So I should put the logic there.

/*
   Fix: I'll make SanityCheck.mqh purely a "Helper" and put the sending logic 
   explicitly in AwesomeExpert AND DatafeedExpert.
   
   Wait, I can't undo the MultiReplace on AwesomeExpert easily without another call.
   // I will Update AwesomeExpert again to use GetDiagnostics().
*/
#endif
