//+------------------------------------------------------------------+
//|                                                   TradeLogger.mqh |
//|                        Copyright 2024, Michael Müller           |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef TRADE_LOGGER_MQH
#define TRADE_LOGGER_MQH

#include <Expert\TradeInfo.mqh>

input group "Trade Logging"
input bool trade_logging_enabled = true;           // Trade Logging aktivieren
input string trade_log_filename = "TradeLog.csv";  // Log-Dateiname

class CTradeLogger
{
private:
   static CTradeLogger* m_instance;
   string               m_filename;
   bool                 m_enabled;
   bool                 m_headerWritten;
   
   // Private constructor für Singleton
   CTradeLogger(void);
   
   bool                 WriteHeader(void);
   bool                 AppendToFile(const string data);
   string               FormatDateTime(const datetime time);
   string               FormatPrice(const double price, const string symbol);
   string               EscapeCSV(const string text);
   string               GetTradeDirection(const ulong ticket);
   double               GetTradeEntryPrice(const ulong ticket);
   double               GetTradeStopLoss(const ulong ticket);
   double               GetTradeTakeProfit(const ulong ticket);
   double               GetTradeVolume(const ulong ticket);
   string               GetTradeComment(const ulong ticket);

public:
   // Singleton Pattern
   static CTradeLogger* GetInstance(void);
   static void          DeleteInstance(void);
   
   ~CTradeLogger(void);
   
   // Konfiguration
   bool                 Initialize(const string filename = "", const bool enabled = true);
   void                 SetEnabled(const bool enabled) { m_enabled = enabled; }
   bool                 IsEnabled(void) const { return m_enabled; }
   
   // Trade Logging mit TradeInfo
   bool                 LogTradeOpen(CTradeInfo* tradeInfo);
   bool                 LogTradeClose(CTradeInfo* tradeInfo);
   bool                 LogTradeModify(CTradeInfo* tradeInfo);
   
   // Einfache Logging-Methoden mit Ticket
   bool                 LogTradeOpen(const ulong ticket);
   bool                 LogTradeClose(const ulong ticket);
   bool                 LogTradeModify(const ulong ticket);
   
   // Direkte Logging-Methode für spezielle Fälle
   bool                 LogTrade(const string symbol, const string direction, 
                                const double entryPrice, const double stopLoss, 
                                const double takeProfit, const double profitLoss,
                                const datetime entryTime, const datetime exitTime,
                                const double volume, const ulong ticket,
                                const string exitReason = "", const string comment = "");
};

// Statische Instanz
CTradeLogger* CTradeLogger::m_instance = NULL;

CTradeLogger::CTradeLogger(void)
{
   m_filename = "TradeLog.csv";
   m_enabled = true;
   m_headerWritten = false;
}

CTradeLogger::~CTradeLogger(void)
{
}

CTradeLogger* CTradeLogger::GetInstance(void)
{
   if(m_instance == NULL)
   {
      m_instance = new CTradeLogger();
   }
   return m_instance;
}

void CTradeLogger::DeleteInstance(void)
{
   if(m_instance != NULL)
   {
      delete m_instance;
      m_instance = NULL;
   }
}

bool CTradeLogger::Initialize(const string filename, const bool enabled)
{
   m_enabled = enabled;
   
   if(!m_enabled)
   {
      Print("Trade Logger deaktiviert");
      return true;
   }
   
   if(filename != "")
      m_filename = filename;
   else
      m_filename = trade_log_filename;
   
   // Prüfen ob Header bereits existiert durch Dateigröße
   int fileHandle = FileOpen(m_filename, FILE_READ | FILE_CSV | FILE_ANSI);
   if(fileHandle != INVALID_HANDLE)
   {
      // Datei existiert bereits
      if(FileSize(fileHandle) > 0)
         m_headerWritten = true;
      FileClose(fileHandle);
   }
   else
   {
      // Neue Datei - Header muss geschrieben werden
      m_headerWritten = false;
   }
   
   Print("Trade Logger initialisiert: ", m_filename);
   return true;
}

bool CTradeLogger::WriteHeader(void)
{
   if(m_headerWritten)
      return true;
      
   string header = "Datum,Symbol,Richtung,Entry Preis,Stop Loss,Take Profit,Gewinn/Verlust," + 
                   "Entry Zeit,Exit Zeit,Volumen,Ticket,Exit Grund,Kommentar";
   
   if(AppendToFile(header))
   {
      m_headerWritten = true;
      return true;
   }
   
   return false;
}

bool CTradeLogger::AppendToFile(const string data)
{
   int fileHandle = FileOpen(m_filename, FILE_WRITE | FILE_READ | FILE_CSV | FILE_ANSI);
   
   if(fileHandle == INVALID_HANDLE)
   {
      Print("Fehler beim Öffnen der Trade-Log-Datei: ", m_filename, " Error: ", GetLastError());
      return false;
   }
   
   // Zum Ende der Datei springen
   FileSeek(fileHandle, 0, SEEK_END);
   
   // Daten anhängen
   uint bytesWritten = FileWriteString(fileHandle, data + "\r\n");
   FileClose(fileHandle);
   
   return (bytesWritten > 0);
}

bool CTradeLogger::LogTradeOpen(CTradeInfo* tradeInfo)
{
   if(!m_enabled || tradeInfo == NULL)
      return true;
      
   if(!WriteHeader())
      return false;
   
   string direction = tradeInfo.IsLong() ? "Long" : "Short";
   
   // Trade-Eröffnung loggen (ohne Exit-Daten)
   string logEntry = FormatDateTime(TimeCurrent()) + "," +
                     EscapeCSV(tradeInfo.strategyName) + "," +
                     direction + "," +
                     FormatPrice(tradeInfo.entryPrice, tradeInfo.strategyName) + "," +
                     FormatPrice(tradeInfo.stopLoss, tradeInfo.strategyName) + "," +
                     FormatPrice(tradeInfo.takeProfitPrice, tradeInfo.strategyName) + "," +
                     "," + // Gewinn/Verlust leer bei Eröffnung
                     FormatDateTime(tradeInfo.orderOpenTime) + "," +
                     "," + // Exit Zeit leer bei Eröffnung
                     DoubleToString(tradeInfo.lots, 2) + "," +
                     IntegerToString(tradeInfo.ticket) + "," +
                     "OPENED," +
                     EscapeCSV(tradeInfo.tradeId);
   
   bool success = AppendToFile(logEntry);
   
   if(success)
   {
      Print("Trade geloggt - Eröffnung: ", tradeInfo.ticket, " ", tradeInfo.strategyName, " ", direction, " @ ", tradeInfo.entryPrice);
   }
   else
   {
      Print("Fehler beim Loggen der Trade-Eröffnung: ", tradeInfo.ticket);
   }
   
   return success;
}

bool CTradeLogger::LogTradeClose(CTradeInfo* tradeInfo)
{
   if(!m_enabled || tradeInfo == NULL)
      return true;
      
   if(!WriteHeader())
      return false;
   
   string direction = tradeInfo.IsLong() ? "Long" : "Short";
   string exitReason = "CLOSED";
   
   // Exit-Grund aus Event-Typ ableiten
   if(tradeInfo.closeEventType == EV_TRADE_TAKEPROFIT_HIT)
      exitReason = "Take Profit";
   else if(tradeInfo.closeEventType == EV_TRADE_STOPLOSS_HIT)
      exitReason = "Stop Loss";
   else if(tradeInfo.stopLossAtBreakeven)
      exitReason = "Breakeven";
   else
      exitReason = "Manual Close";
   
   return LogTrade(tradeInfo.strategyName, direction, tradeInfo.entryPrice, 
                   tradeInfo.stopLoss, tradeInfo.takeProfitPrice, tradeInfo.profit,
                   tradeInfo.orderOpenTime, tradeInfo.orderCloseTime, tradeInfo.lots, 
                   tradeInfo.ticket, exitReason, tradeInfo.tradeId);
}

bool CTradeLogger::LogTradeModify(CTradeInfo* tradeInfo)
{
   if(!m_enabled || tradeInfo == NULL)
      return true;
   
   if(!WriteHeader())
      return false;
   
   string direction = tradeInfo.IsLong() ? "Long" : "Short";
   
   string logEntry = FormatDateTime(TimeCurrent()) + "," +
                     EscapeCSV(tradeInfo.strategyName) + "," +
                     direction + "," +
                     FormatPrice(tradeInfo.entryPrice, tradeInfo.strategyName) + "," +
                     FormatPrice(tradeInfo.stopLoss, tradeInfo.strategyName) + "," +
                     FormatPrice(tradeInfo.takeProfitPrice, tradeInfo.strategyName) + "," +
                     "," + // Gewinn/Verlust
                     FormatDateTime(tradeInfo.orderOpenTime) + "," +
                     "," + // Exit Zeit
                     DoubleToString(tradeInfo.lots, 2) + "," +
                     IntegerToString(tradeInfo.ticket) + "," +
                     "MODIFIED," +
                     EscapeCSV(tradeInfo.tradeId);
   
   return AppendToFile(logEntry);
}

bool CTradeLogger::LogTradeOpen(const ulong ticket)
{
   if(!m_enabled)
      return true;
      
   if(!WriteHeader())
      return false;
   
   // Vereinfachte Version mit aktuellen Positionsdaten
   if(!PositionSelectByTicket(ticket))
   {
      Print("Trade Logger: Position für Ticket nicht gefunden: ", ticket);
      return false;
   }
   
   string symbol = PositionGetString(POSITION_SYMBOL);
   string direction = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? "Long" : "Short";
   double entryPrice = PositionGetDouble(POSITION_PRICE_OPEN);
   double stopLoss = PositionGetDouble(POSITION_SL);
   double takeProfit = PositionGetDouble(POSITION_TP);
   double volume = PositionGetDouble(POSITION_VOLUME);
   datetime entryTime = (datetime)PositionGetInteger(POSITION_TIME);
   string comment = PositionGetString(POSITION_COMMENT);
   
   string logEntry = FormatDateTime(TimeCurrent()) + "," +
                     EscapeCSV(symbol) + "," +
                     direction + "," +
                     FormatPrice(entryPrice, symbol) + "," +
                     FormatPrice(stopLoss, symbol) + "," +
                     FormatPrice(takeProfit, symbol) + "," +
                     "," + // Gewinn/Verlust leer bei Eröffnung
                     FormatDateTime(entryTime) + "," +
                     "," + // Exit Zeit leer bei Eröffnung
                     DoubleToString(volume, 2) + "," +
                     IntegerToString(ticket) + "," +
                     "OPENED," +
                     EscapeCSV(comment);
   
   bool success = AppendToFile(logEntry);
   
   if(success)
   {
      Print("Trade geloggt - Eröffnung: ", ticket, " ", symbol, " ", direction, " @ ", entryPrice);
   }
   else
   {
      Print("Fehler beim Loggen der Trade-Eröffnung: ", ticket);
   }
   
   return success;
}

bool CTradeLogger::LogTradeClose(const ulong ticket)
{
   if(!m_enabled)
      return true;
      
   if(!WriteHeader())
      return false;
   
   // Trade-Details aus History holen - vereinfachte Version
   if(!HistorySelectByPosition(ticket))
   {
      Print("Trade Logger: Keine History für Position gefunden: ", ticket);
      return false;
   }
   
   string symbol = "";
   string direction = "";
   double entryPrice = 0.0;
   double stopLoss = 0.0;
   double takeProfit = 0.0;
   double profitLoss = 0.0;
   datetime entryTime = 0;
   datetime exitTime = TimeCurrent();
   double volume = 0.0;
   string exitReason = "CLOSED";
   string comment = "";
   
   // Deals durchsuchen
   uint dealsTotal = HistoryDealsTotal();
   for(uint i = 0; i < dealsTotal; i++)
   {
      ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket > 0 && HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID) == ticket)
      {
         long dealEntry = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
         
         if(dealEntry == DEAL_ENTRY_IN)
         {
            // Entry Deal
            symbol = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
            long dealType = HistoryDealGetInteger(dealTicket, DEAL_TYPE);
            direction = (dealType == DEAL_TYPE_BUY) ? "Long" : "Short";
            entryPrice = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
            entryTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
            volume = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
            comment = HistoryDealGetString(dealTicket, DEAL_COMMENT);
         }
         else if(dealEntry == DEAL_ENTRY_OUT)
         {
            // Exit Deal
            exitTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
            profitLoss = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
            
            // Exit-Grund bestimmen
            string dealComment = StringToLower(HistoryDealGetString(dealTicket, DEAL_COMMENT));
            if(StringFind(dealComment, "tp") >= 0)
               exitReason = "Take Profit";
            else if(StringFind(dealComment, "sl") >= 0)
               exitReason = "Stop Loss";
            else
               exitReason = "Manual Close";
         }
      }
   }
   
   if(symbol == "")
   {
      Print("Trade Logger: Unvollständige Trade-Daten für Ticket: ", ticket);
      return false;
   }
   
   return LogTrade(symbol, direction, entryPrice, stopLoss, takeProfit, 
                   profitLoss, entryTime, exitTime, volume, ticket, exitReason, comment);
}

bool CTradeLogger::LogTradeModify(const ulong ticket)
{
   if(!m_enabled)
      return true;
   
   if(!PositionSelectByTicket(ticket))
      return false;
   
   string symbol = PositionGetString(POSITION_SYMBOL);
   string direction = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY) ? "Long" : "Short";
   double entryPrice = PositionGetDouble(POSITION_PRICE_OPEN);
   double stopLoss = PositionGetDouble(POSITION_SL);
   double takeProfit = PositionGetDouble(POSITION_TP);
   double volume = PositionGetDouble(POSITION_VOLUME);
   datetime entryTime = (datetime)PositionGetInteger(POSITION_TIME);
   string comment = PositionGetString(POSITION_COMMENT);
   
   string logEntry = FormatDateTime(TimeCurrent()) + "," +
                     EscapeCSV(symbol) + "," +
                     direction + "," +
                     FormatPrice(entryPrice, symbol) + "," +
                     FormatPrice(stopLoss, symbol) + "," +
                     FormatPrice(takeProfit, symbol) + "," +
                     "," + // Gewinn/Verlust
                     FormatDateTime(entryTime) + "," +
                     "," + // Exit Zeit
                     DoubleToString(volume, 2) + "," +
                     IntegerToString(ticket) + "," +
                     "MODIFIED," +
                     EscapeCSV(comment);
   
   return AppendToFile(logEntry);
}

bool CTradeLogger::LogTrade(const string symbol, const string direction, 
                           const double entryPrice, const double stopLoss, 
                           const double takeProfit, const double profitLoss,
                           const datetime entryTime, const datetime exitTime,
                           const double volume, const ulong ticket,
                           const string exitReason, const string comment)
{
   if(!m_enabled)
      return true;
      
   if(!WriteHeader())
      return false;
   
   string logEntry = FormatDateTime(TimeCurrent()) + "," +
                     EscapeCSV(symbol) + "," +
                     direction + "," +
                     FormatPrice(entryPrice, symbol) + "," +
                     FormatPrice(stopLoss, symbol) + "," +
                     FormatPrice(takeProfit, symbol) + "," +
                     DoubleToString(profitLoss, 2) + "," +
                     FormatDateTime(entryTime) + "," +
                     FormatDateTime(exitTime) + "," +
                     DoubleToString(volume, 2) + "," +
                     IntegerToString(ticket) + "," +
                     EscapeCSV(exitReason) + "," +
                     EscapeCSV(comment);
   
   bool success = AppendToFile(logEntry);
   
   if(success)
   {
      Print("Trade geloggt - Vollständig: ", ticket, " ", symbol, " ", direction, 
            " P/L: ", profitLoss, " Grund: ", exitReason);
   }
   else
   {
      Print("Fehler beim Loggen des Trades: ", ticket);
   }
   
   return success;
}

string CTradeLogger::FormatDateTime(const datetime time)
{
   if(time == 0)
      return "";
   
   MqlDateTime dt;
   TimeToStruct(time, dt);
   
   return StringFormat("%04d-%02d-%02d %02d:%02d:%02d", 
                       dt.year, dt.mon, dt.day, dt.hour, dt.min, dt.sec);
}

string CTradeLogger::FormatPrice(const double price, const string symbol)
{
   if(price == 0.0)
      return "";
   
   int digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
   return DoubleToString(price, digits);
}

string CTradeLogger::EscapeCSV(const string text)
{
   if(text == "")
      return "";
   
   // Anführungszeichen und Kommas escapen
   if(StringFind(text, ",") >= 0 || StringFind(text, "\"") >= 0 || StringFind(text, "\n") >= 0)
   {
      string escaped = text;
      StringReplace(escaped, "\"", "\"\"");
      return "\"" + escaped + "\"";
   }
   
   return text;
}

// Convenience-Funktionen für einfache Nutzung
bool LogTradeOpen(const ulong ticket)
{
   return CTradeLogger::GetInstance().LogTradeOpen(ticket);
}

bool LogTradeClose(const ulong ticket)
{
   return CTradeLogger::GetInstance().LogTradeClose(ticket);
}

bool LogTradeModify(const ulong ticket)
{
   return CTradeLogger::GetInstance().LogTradeModify(ticket);
}

// Überladungen für TradeInfo
bool LogTradeOpen(CTradeInfo* tradeInfo)
{
   return CTradeLogger::GetInstance().LogTradeOpen(tradeInfo);
}

bool LogTradeClose(CTradeInfo* tradeInfo)
{
   return CTradeLogger::GetInstance().LogTradeClose(tradeInfo);
}

bool LogTradeModify(CTradeInfo* tradeInfo)
{
   return CTradeLogger::GetInstance().LogTradeModify(tradeInfo);
}

#endif // TRADE_LOGGER_MQH

