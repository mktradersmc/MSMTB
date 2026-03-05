//+------------------------------------------------------------------+
//|                                       TradeLoggerIntegration.mqh |
//|                        Copyright 2024, Michael Müller           |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef TRADE_LOGGER_INTEGRATION_MQH
#define TRADE_LOGGER_INTEGRATION_MQH

#include <Expert\TradeLogger.mqh>

/*
INTEGRATION BEISPIEL:

In Ihrem BaseExpert.mqh oder AwesomeExpert.mqh fügen Sie folgendes hinzu:

1. Include am Anfang der Datei:
   #include <Expert\TradeLogger.mqh>

2. In der OnInit() Funktion:
   // Trade Logger initialisieren
   CTradeLogger::GetInstance().Initialize(trade_log_filename, trade_logging_enabled);

3. Bei Trade-Eröffnung (z.B. in TradeManager oder wo Trades eröffnet werden):
   // Nach erfolgreichem Trade-Opening
   if(ticket > 0) 
   {
      LogTradeOpen(ticket);
   }

4. Bei Trade-Schließung:
   // Nach erfolgreichem Trade-Closing
   if(trade_closed_successfully) 
   {
      LogTradeClose(ticket);
   }

5. Bei Trade-Modifikation (SL/TP Änderung):
   // Nach erfolgreichem Modify
   if(modify_successful) 
   {
      LogTradeModify(ticket);
   }

6. In OnDeinit() für saubere Bereinigung:
   CTradeLogger::DeleteInstance();
*/

// Beispiel-Integration für TradeManager
class CTradeManagerWithLogging
{
private:
   // Ihre bestehenden Variablen...
   
public:
   // Trade öffnen mit Logging
   ulong OpenTrade(ENUM_ORDER_TYPE orderType, double volume, double price, 
                   double stopLoss, double takeProfit, string comment = "")
   {
      // Ihr bestehender Trade-Opening Code...
      ulong ticket = 0;
      
      // Beispiel für Trade-Opening (vereinfacht)
      // ticket = OrderSend(...);
      
      if(ticket > 0)
      {
         // Trade erfolgreich eröffnet - loggen
         LogTradeOpen(ticket);
         Print("Trade eröffnet und geloggt: ", ticket);
      }
      else
      {
         Print("Fehler beim Eröffnen des Trades: ", GetLastError());
      }
      
      return ticket;
   }
   
   // Trade schließen mit Logging
   bool CloseTrade(ulong ticket)
   {
      // Ihr bestehender Trade-Closing Code...
      bool success = false;
      
      // Beispiel für Trade-Closing (vereinfacht)
      // success = OrderClose(...);
      
      if(success)
      {
         // Trade erfolgreich geschlossen - loggen
         LogTradeClose(ticket);
         Print("Trade geschlossen und geloggt: ", ticket);
      }
      else
      {
         Print("Fehler beim Schließen des Trades: ", ticket, " Error: ", GetLastError());
      }
      
      return success;
   }
   
   // Trade modifizieren mit Logging
   bool ModifyTrade(ulong ticket, double newStopLoss, double newTakeProfit)
   {
      // Ihr bestehender Trade-Modify Code...
      bool success = false;
      
      // Beispiel für Trade-Modify (vereinfacht)
      // success = OrderModify(...);
      
      if(success)
      {
         // Trade erfolgreich modifiziert - loggen
         LogTradeModify(ticket);
         Print("Trade modifiziert und geloggt: ", ticket);
      }
      else
      {
         Print("Fehler beim Modifizieren des Trades: ", ticket, " Error: ", GetLastError());
      }
      
      return success;
   }
};

// Event-Handler Integration (falls Sie Events verwenden)
class CTradeEventHandlerWithLogging
{
public:
   void OnTradeEvent(const int eventType, const ulong ticket)
   {
      switch(eventType)
      {
         case 1: // Trade opened
            LogTradeOpen(ticket);
            break;
            
         case 2: // Trade closed
            LogTradeClose(ticket);
            break;
            
         case 3: // Trade modified
            LogTradeModify(ticket);
            break;
      }
   }
};

// Utility-Funktionen für erweiterte Nutzung
class CTradeLoggerUtils
{
public:
   // Manueller Trade-Log (für spezielle Fälle)
   static bool LogManualTrade(const string symbol, const bool isLong, 
                             const double entryPrice, const double exitPrice,
                             const double volume, const string comment = "Manual")
   {
      CTradeLogger* logger = CTradeLogger::GetInstance();
      
      double profitLoss = isLong ? (exitPrice - entryPrice) * volume : 
                                   (entryPrice - exitPrice) * volume;
      
      return logger.LogTrade(symbol, 
                            isLong ? "Long" : "Short",
                            entryPrice, 
                            0.0, // SL
                            0.0, // TP
                            profitLoss,
                            TimeCurrent(), // Entry Zeit
                            TimeCurrent(), // Exit Zeit
                            volume,
                            0, // Ticket (bei manuellen Trades)
                            "Manual Close",
                            comment);
   }
   
   // Statistiken aus der Log-Datei lesen (einfache Version)
   static void PrintLogStatistics()
   {
      Print("=== Trade Log Statistiken ===");
      Print("Log-Datei: ", trade_log_filename);
      Print("Status: ", CTradeLogger::GetInstance().IsEnabled() ? "Aktiv" : "Inaktiv");
      Print("============================");
   }
   
   // Log-Datei Pfad abrufen
   static string GetLogFilePath()
   {
      return TerminalInfoString(TERMINAL_DATA_PATH) + "\\MQL5\\Files\\" + trade_log_filename;
   }
};

#endif // TRADE_LOGGER_INTEGRATION_MQH

