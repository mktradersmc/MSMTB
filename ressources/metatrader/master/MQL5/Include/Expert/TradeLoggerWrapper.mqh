//+------------------------------------------------------------------+
//|                                         TradeLoggerWrapper.mqh   |
//|                        Copyright 2024, Michael Müller           |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+

/*
EINFACHE INTEGRATION FÜR TRADE LOGGING

Verwenden Sie diese Datei für eine schnelle Integration ohne Änderung 
der bestehenden AwesomeExpert.mqh Datei.

VERWENDUNG:
1. Fügen Sie diese Zeile am Anfang Ihrer EA-Datei hinzu:
   #include <Expert\TradeLoggerWrapper.mqh>

2. Rufen Sie diese Funktionen in Ihrem Code auf:
   - InitTradeLogging() in OnInit()
   - CleanupTradeLogging() in OnDeinit()
   - LogTrade_Open(ticket) nach Trade-Eröffnung
   - LogTrade_Close(ticket) nach Trade-Schließung
   - LogTrade_Modify(ticket) nach Trade-Modifikation
*/

#ifndef TRADE_LOGGER_WRAPPER_MQH
#define TRADE_LOGGER_WRAPPER_MQH

#include <Expert\TradeLogger.mqh>

// Globale Variablen für Wrapper
bool g_tradeLoggingInitialized = false;

//+------------------------------------------------------------------+
//| Initialisiert das Trade Logging                                 |
//+------------------------------------------------------------------+
void InitTradeLogging()
{
   if(!g_tradeLoggingInitialized)
   {
      CTradeLogger::GetInstance().Initialize(trade_log_filename, trade_logging_enabled);
      g_tradeLoggingInitialized = true;
      Print("✓ Trade Logging aktiviert: ", trade_log_filename);
   }
}

//+------------------------------------------------------------------+
//| Bereinigt das Trade Logging                                     |
//+------------------------------------------------------------------+
void CleanupTradeLogging()
{
   if(g_tradeLoggingInitialized)
   {
      CTradeLogger::DeleteInstance();
      g_tradeLoggingInitialized = false;
      Print("✓ Trade Logging beendet");
   }
}

//+------------------------------------------------------------------+
//| Loggt Trade-Eröffnung                                           |
//+------------------------------------------------------------------+
void LogTrade_Open(ulong ticket)
{
   if(g_tradeLoggingInitialized && ticket > 0)
   {
      LogTradeOpen(ticket);
   }
}

//+------------------------------------------------------------------+
//| Loggt Trade-Schließung                                          |
//+------------------------------------------------------------------+
void LogTrade_Close(ulong ticket)
{
   if(g_tradeLoggingInitialized && ticket > 0)
   {
      LogTradeClose(ticket);
   }
}

//+------------------------------------------------------------------+
//| Loggt Trade-Modifikation                                        |
//+------------------------------------------------------------------+
void LogTrade_Modify(ulong ticket)
{
   if(g_tradeLoggingInitialized && ticket > 0)
   {
      LogTradeModify(ticket);
   }
}

//+------------------------------------------------------------------+
//| Erweiterte Logging-Funktion für manuelle Trades                 |
//+------------------------------------------------------------------+
void LogTrade_Manual(string symbol, bool isLong, double entryPrice, double exitPrice, 
                     double volume, string comment = "Manual Trade")
{
   if(!g_tradeLoggingInitialized) return;
   
   double profitLoss = 0.0;
   if(isLong)
      profitLoss = (exitPrice - entryPrice) * volume * SymbolInfoDouble(symbol, SYMBOL_TRADE_CONTRACT_SIZE);
   else
      profitLoss = (entryPrice - exitPrice) * volume * SymbolInfoDouble(symbol, SYMBOL_TRADE_CONTRACT_SIZE);
   
   CTradeLogger::GetInstance().LogTrade(
      symbol,
      isLong ? "Long" : "Short",
      entryPrice,
      0.0, // SL
      0.0, // TP
      profitLoss,
      TimeCurrent(), // Entry Zeit
      TimeCurrent(), // Exit Zeit
      volume,
      0, // Kein Ticket bei manuellen Trades
      "Manual Close",
      comment
   );
}

//+------------------------------------------------------------------+
//| Prüft ob Logging aktiv ist                                      |
//+------------------------------------------------------------------+
bool IsTradeLoggingActive()
{
   return g_tradeLoggingInitialized && trade_logging_enabled;
}

//+------------------------------------------------------------------+
//| Zeigt Logging-Status                                            |
//+------------------------------------------------------------------+
void PrintTradeLoggingStatus()
{
   Print("=== Trade Logging Status ===");
   Print("Aktiviert: ", trade_logging_enabled ? "Ja" : "Nein");
   Print("Initialisiert: ", g_tradeLoggingInitialized ? "Ja" : "Nein");
   Print("Datei: ", trade_log_filename);
   Print("===========================");
}

#endif // TRADE_LOGGER_WRAPPER_MQH

