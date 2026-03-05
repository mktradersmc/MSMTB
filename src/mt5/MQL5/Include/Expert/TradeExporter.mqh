//+------------------------------------------------------------------+
//|                                                 TradeExporter.mqh |
//|                        Copyright 2024, Michael Müller           |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef TRADE_EXPORTER_MQH
#define TRADE_EXPORTER_MQH

#include <Object.mqh>
#include <Arrays\ArrayObj.mqh>
#include <Files\File.mqh>
#include <Expert\TradeRecord.mqh>

enum ENUM_EXPORT_FORMAT
{
   EXPORT_CSV = 0,   // CSV Format
   EXPORT_TSV = 1    // Tab-separated (für Excel)
};

class CTradeExporter : public CObject
{
private:
   CArrayObj*        m_tradeRecords;
   string            m_filePath;
   ENUM_EXPORT_FORMAT m_format;
   string            m_delimiter;
   
   string            FormatDateTime(const datetime time);
   string            FormatDouble(const double value, const int digits = 5);
   string            EscapeCSVField(const string field);
   bool              WriteHeader(CFile& file);
   bool              WriteTradeRecord(CFile& file, CTradeRecord* record);

public:
   CTradeExporter(void);
   CTradeExporter(const string filePath, const ENUM_EXPORT_FORMAT format = EXPORT_CSV);
   ~CTradeExporter(void);
   
   // Configuration
   void              SetFilePath(const string path) { m_filePath = path; }
   void              SetFormat(const ENUM_EXPORT_FORMAT format);
   string            GetFilePath(void) const { return m_filePath; }
   
   // Trade management
   bool              AddTradeRecord(CTradeRecord* record);
   bool              RemoveTradeRecord(const ulong ticket);
   CTradeRecord*     GetTradeRecord(const ulong ticket);
   int               GetTradeCount(void) const { return m_tradeRecords.Total(); }
   void              ClearRecords(void);
   
   // Export functionality
   bool              ExportToFile(void);
   bool              ExportToFile(const string fileName);
   bool              ExportCompletedTrades(void);
   bool              ExportTradesByDateRange(const datetime startDate, const datetime endDate);
   bool              ExportTradesBySymbol(const string symbol);
   
   // Statistics
   double            GetTotalProfit(void);
   double            GetTotalLoss(void);
   int               GetWinningTrades(void);
   int               GetLosingTrades(void);
   double            GetWinRate(void);
   
   // Utility
   string            GenerateFileName(const string prefix = "TradeReport");
};

CTradeExporter::CTradeExporter(void)
{
   m_tradeRecords = new CArrayObj();
   m_filePath = "";
   m_format = EXPORT_CSV;
   m_delimiter = ",";
}

CTradeExporter::CTradeExporter(const string filePath, const ENUM_EXPORT_FORMAT format)
{
   m_tradeRecords = new CArrayObj();
   m_filePath = filePath;
   SetFormat(format);
}

CTradeExporter::~CTradeExporter(void)
{
   if(m_tradeRecords != NULL)
   {
      m_tradeRecords.Clear();
      delete m_tradeRecords;
   }
}

void CTradeExporter::SetFormat(const ENUM_EXPORT_FORMAT format)
{
   m_format = format;
   m_delimiter = (format == EXPORT_CSV) ? "," : "\t";
}

bool CTradeExporter::AddTradeRecord(CTradeRecord* record)
{
   if(record == NULL)
      return false;
      
   // Prüfen ob bereits vorhanden
   for(int i = 0; i < m_tradeRecords.Total(); i++)
   {
      CTradeRecord* existing = m_tradeRecords.At(i);
      if(existing != NULL && existing.GetTicket() == record.GetTicket())
      {
         // Update existing record
         m_tradeRecords.Update(i, record);
         return true;
      }
   }
   
   return m_tradeRecords.Add(record);
}

bool CTradeExporter::RemoveTradeRecord(const ulong ticket)
{
   for(int i = 0; i < m_tradeRecords.Total(); i++)
   {
      CTradeRecord* record = m_tradeRecords.At(i);
      if(record != NULL && record.GetTicket() == ticket)
      {
         return m_tradeRecords.Delete(i);
      }
   }
   return false;
}

CTradeRecord* CTradeExporter::GetTradeRecord(const ulong ticket)
{
   for(int i = 0; i < m_tradeRecords.Total(); i++)
   {
      CTradeRecord* record = m_tradeRecords.At(i);
      if(record != NULL && record.GetTicket() == ticket)
         return record;
   }
   return NULL;
}

void CTradeExporter::ClearRecords(void)
{
   m_tradeRecords.Clear();
}

bool CTradeExporter::ExportToFile(void)
{
   if(m_filePath == "")
   {
      m_filePath = GenerateFileName();
   }
   
   return ExportToFile(m_filePath);
}

bool CTradeExporter::ExportToFile(const string fileName)
{
   CFile file;
   
   if(!file.Open(fileName, FILE_WRITE | FILE_CSV | FILE_ANSI))
   {
      Print("Fehler beim Öffnen der Datei: ", fileName);
      return false;
   }
   
   // Header schreiben
   if(!WriteHeader(file))
   {
      file.Close();
      return false;
   }
   
   // Trade-Datensätze schreiben
   for(int i = 0; i < m_tradeRecords.Total(); i++)
   {
      CTradeRecord* record = m_tradeRecords.At(i);
      if(record != NULL)
      {
         if(!WriteTradeRecord(file, record))
         {
            Print("Fehler beim Schreiben des Trade-Datensatzes: ", record.GetTicket());
         }
      }
   }
   
   file.Close();
   Print("Trade-Export erfolgreich: ", fileName, " (", m_tradeRecords.Total(), " Trades)");
   return true;
}

bool CTradeExporter::WriteHeader(CFile& file)
{
   string header = "Symbol" + m_delimiter + 
                   "Richtung" + m_delimiter + 
                   "Entry Preis" + m_delimiter + 
                   "Stop Loss" + m_delimiter + 
                   "Take Profit" + m_delimiter + 
                   "Gewinn/Verlust" + m_delimiter + 
                   "Entry Zeit" + m_delimiter + 
                   "Exit Zeit" + m_delimiter + 
                   "Volumen" + m_delimiter + 
                   "Ticket" + m_delimiter + 
                   "Exit Grund" + m_delimiter + 
                   "Kommission" + m_delimiter + 
                   "Swap" + m_delimiter + 
                   "Kommentar";
   
   return file.WriteString(header + "\n");
}

bool CTradeExporter::WriteTradeRecord(CFile& file, CTradeRecord* record)
{
   if(record == NULL)
      return false;
   
   string line = EscapeCSVField(record.GetSymbol()) + m_delimiter + 
                 EscapeCSVField(record.GetDirectionString()) + m_delimiter + 
                 FormatDouble(record.GetEntryPrice()) + m_delimiter + 
                 FormatDouble(record.GetStopLoss()) + m_delimiter + 
                 FormatDouble(record.GetTakeProfit()) + m_delimiter + 
                 FormatDouble(record.GetProfitLoss(), 2) + m_delimiter + 
                 FormatDateTime(record.GetEntryTime()) + m_delimiter + 
                 FormatDateTime(record.GetExitTime()) + m_delimiter + 
                 FormatDouble(record.GetVolume(), 2) + m_delimiter + 
                 IntegerToString(record.GetTicket()) + m_delimiter + 
                 EscapeCSVField(record.GetExitReasonString()) + m_delimiter + 
                 FormatDouble(record.GetCommission(), 2) + m_delimiter + 
                 FormatDouble(record.GetSwap(), 2) + m_delimiter + 
                 EscapeCSVField(record.GetComment());
   
   return file.WriteString(line + "\n");
}

string CTradeExporter::FormatDateTime(const datetime time)
{
   if(time == 0)
      return "";
   
   MqlDateTime dt;
   TimeToStruct(time, dt);
   
   return StringFormat("%04d-%02d-%02d %02d:%02d:%02d", 
                       dt.year, dt.mon, dt.day, dt.hour, dt.min, dt.sec);
}

string CTradeExporter::FormatDouble(const double value, const int digits)
{
   if(value == 0.0)
      return "0";
   
   return DoubleToString(value, digits);
}

string CTradeExporter::EscapeCSVField(const string field)
{
   if(m_format == EXPORT_TSV)
      return field; // Tab-separated benötigt normalerweise kein Escaping
   
   // CSV: Felder mit Kommas, Anführungszeichen oder Zeilenumbrüchen in Anführungszeichen setzen
   if(StringFind(field, ",") >= 0 || StringFind(field, "\"") >= 0 || StringFind(field, "\n") >= 0)
   {
      string escaped = field;
      StringReplace(escaped, "\"", "\"\""); // Anführungszeichen verdoppeln
      return "\"" + escaped + "\"";
   }
   
   return field;
}

bool CTradeExporter::ExportCompletedTrades(void)
{
   CTradeExporter tempExporter(GenerateFileName("CompletedTrades"), m_format);
   
   for(int i = 0; i < m_tradeRecords.Total(); i++)
   {
      CTradeRecord* record = m_tradeRecords.At(i);
      if(record != NULL && record.IsCompleted())
      {
         tempExporter.AddTradeRecord(record);
      }
   }
   
   return tempExporter.ExportToFile();
}

bool CTradeExporter::ExportTradesByDateRange(const datetime startDate, const datetime endDate)
{
   CTradeExporter tempExporter(GenerateFileName("TradesByDate"), m_format);
   
   for(int i = 0; i < m_tradeRecords.Total(); i++)
   {
      CTradeRecord* record = m_tradeRecords.At(i);
      if(record != NULL && 
         record.GetEntryTime() >= startDate && 
         record.GetEntryTime() <= endDate)
      {
         tempExporter.AddTradeRecord(record);
      }
   }
   
   return tempExporter.ExportToFile();
}

bool CTradeExporter::ExportTradesBySymbol(const string symbol)
{
   CTradeExporter tempExporter(GenerateFileName("Trades_" + symbol), m_format);
   
   for(int i = 0; i < m_tradeRecords.Total(); i++)
   {
      CTradeRecord* record = m_tradeRecords.At(i);
      if(record != NULL && record.GetSymbol() == symbol)
      {
         tempExporter.AddTradeRecord(record);
      }
   }
   
   return tempExporter.ExportToFile();
}

double CTradeExporter::GetTotalProfit(void)
{
   double totalProfit = 0.0;
   
   for(int i = 0; i < m_tradeRecords.Total(); i++)
   {
      CTradeRecord* record = m_tradeRecords.At(i);
      if(record != NULL && record.GetProfitLoss() > 0)
         totalProfit += record.GetProfitLoss();
   }
   
   return totalProfit;
}

double CTradeExporter::GetTotalLoss(void)
{
   double totalLoss = 0.0;
   
   for(int i = 0; i < m_tradeRecords.Total(); i++)
   {
      CTradeRecord* record = m_tradeRecords.At(i);
      if(record != NULL && record.GetProfitLoss() < 0)
         totalLoss += record.GetProfitLoss();
   }
   
   return totalLoss;
}

int CTradeExporter::GetWinningTrades(void)
{
   int count = 0;
   
   for(int i = 0; i < m_tradeRecords.Total(); i++)
   {
      CTradeRecord* record = m_tradeRecords.At(i);
      if(record != NULL && record.GetProfitLoss() > 0)
         count++;
   }
   
   return count;
}

int CTradeExporter::GetLosingTrades(void)
{
   int count = 0;
   
   for(int i = 0; i < m_tradeRecords.Total(); i++)
   {
      CTradeRecord* record = m_tradeRecords.At(i);
      if(record != NULL && record.GetProfitLoss() < 0)
         count++;
   }
   
   return count;
}

double CTradeExporter::GetWinRate(void)
{
   int totalTrades = GetWinningTrades() + GetLosingTrades();
   if(totalTrades == 0)
      return 0.0;
   
   return (double)GetWinningTrades() / totalTrades * 100.0;
}

string CTradeExporter::GenerateFileName(const string prefix)
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   
   string extension = (m_format == EXPORT_CSV) ? ".csv" : ".txt";
   
   return StringFormat("%s_%04d%02d%02d_%02d%02d%s", 
                       prefix, dt.year, dt.mon, dt.day, dt.hour, dt.min, extension);
}

#endif // TRADE_EXPORTER_MQH

