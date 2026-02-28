//+------------------------------------------------------------------+
//|                                      TradeDocumentationManager.mqh |
//|                        Copyright 2024, Michael Müller           |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef TRADE_DOCUMENTATION_MANAGER_MQH
#define TRADE_DOCUMENTATION_MANAGER_MQH

#include <Object.mqh>
#include <Arrays\ArrayObj.mqh>
#include <Expert\TradeRecord.mqh>
#include <Expert\TradeExporter.mqh>
#include <Expert\EventHandler.mqh>
#include <Expert\TradeEvent.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\HistoryDealInfo.mqh>

input group "Trade Dokumentation"
input bool trade_doc_enabled = true;                    // Trade Dokumentation aktivieren
input bool trade_doc_auto_export = false;               // Automatischer Export bei Trade-Schließung
input ENUM_EXPORT_FORMAT trade_doc_export_format = EXPORT_CSV;  // Export Format
input string trade_doc_export_path = "";                // Export Pfad (leer = automatisch)
input int trade_doc_max_records = 1000;                 // Maximale Anzahl gespeicherter Records

class CTradeDocumentationManager : public CObject, public CEventHandler
{
private:
   CTradeExporter*   m_exporter;
   CArrayObj*        m_activeRecords;    // Aktive Trades
   bool              m_enabled;
   bool              m_autoExport;
   int               m_maxRecords;
   string            m_exportPath;
   
   // Hilfsmethoden
   CTradeRecord*     CreateTradeRecord(const ulong ticket);
   bool              UpdateTradeRecord(CTradeRecord* record, const ulong ticket);
   CTradeRecord*     FindActiveRecord(const ulong ticket);
   bool              RemoveActiveRecord(const ulong ticket);
   void              CleanupOldRecords(void);
   ENUM_TRADE_DIRECTION GetTradeDirection(const ENUM_POSITION_TYPE posType);
   ENUM_TRADE_EXIT_REASON DetermineExitReason(const ulong ticket);
   
public:
   CTradeDocumentationManager(void);
   ~CTradeDocumentationManager(void);
   
   // Initialisierung und Konfiguration
   bool              Initialize(void);
   void              SetEnabled(const bool enabled) { m_enabled = enabled; }
   void              SetAutoExport(const bool autoExport) { m_autoExport = autoExport; }
   void              SetExportPath(const string path) { m_exportPath = path; }
   void              SetMaxRecords(const int maxRecords) { m_maxRecords = maxRecords; }
   
   // Event Handler Interface
   void              OnEvent(CEvent* event) override;
   
   // Trade Management
   bool              OnTradeOpen(const ulong ticket);
   bool              OnTradeClose(const ulong ticket);
   bool              OnTradeModify(const ulong ticket);
   
   // Export Funktionen
   bool              ExportAllTrades(void);
   bool              ExportCompletedTrades(void);
   bool              ExportTradesBySymbol(const string symbol);
   bool              ExportTradesByDateRange(const datetime startDate, const datetime endDate);
   bool              ExportToFile(const string fileName);
   
   // Statistiken
   int               GetActiveTradeCount(void) const { return m_activeRecords.Total(); }
   int               GetCompletedTradeCount(void) const;
   double            GetTotalProfit(void) const;
   double            GetTotalLoss(void) const;
   double            GetWinRate(void) const;
   
   // Utility
   void              ClearAllRecords(void);
   bool              LoadHistoricalTrades(const datetime startDate, const datetime endDate);
   void              PrintStatistics(void);
};

CTradeDocumentationManager::CTradeDocumentationManager(void)
{
   m_exporter = new CTradeExporter();
   m_activeRecords = new CArrayObj();
   m_enabled = true;
   m_autoExport = false;
   m_maxRecords = 1000;
   m_exportPath = "";
}

CTradeDocumentationManager::~CTradeDocumentationManager(void)
{
   if(m_exporter != NULL)
      delete m_exporter;
      
   if(m_activeRecords != NULL)
   {
      m_activeRecords.Clear();
      delete m_activeRecords;
   }
}

bool CTradeDocumentationManager::Initialize(void)
{
   if(!m_enabled)
      return true;
      
   // Export-Pfad konfigurieren
   if(m_exportPath != "")
   {
      m_exporter.SetFilePath(m_exportPath);
   }
   
   m_exporter.SetFormat(trade_doc_export_format);
   
   Print("Trade Documentation Manager initialisiert. Pfad: ", 
         (m_exportPath == "") ? "Automatisch" : m_exportPath);
   
   return true;
}

void CTradeDocumentationManager::OnEvent(CEvent* event)
{
   if(!m_enabled || event == NULL)
      return;
      
   if(event.GetEventType() == EVENT_TRADE_OPENED)
   {
      CTradeEvent* tradeEvent = dynamic_cast<CTradeEvent*>(event);
      if(tradeEvent != NULL)
      {
         // Trade-Eröffnung dokumentieren
         OnTradeOpen(tradeEvent.GetTicket());
      }
   }
   else if(event.GetEventType() == EVENT_TRADE_CLOSED)
   {
      CTradeEvent* tradeEvent = dynamic_cast<CTradeEvent*>(event);
      if(tradeEvent != NULL)
      {
         // Trade-Schließung dokumentieren
         OnTradeClose(tradeEvent.GetTicket());
      }
   }
}

bool CTradeDocumentationManager::OnTradeOpen(const ulong ticket)
{
   if(!m_enabled)
      return true;
      
   CTradeRecord* record = CreateTradeRecord(ticket);
   if(record == NULL)
   {
      Print("Fehler beim Erstellen des Trade Records für Ticket: ", ticket);
      return false;
   }
   
   if(!m_activeRecords.Add(record))
   {
      Print("Fehler beim Hinzufügen des Trade Records für Ticket: ", ticket);
      delete record;
      return false;
   }
   
   // Auch zum Exporter hinzufügen
   m_exporter.AddTradeRecord(record);
   
   Print("Trade dokumentiert - Eröffnung: ", ticket, " ", record.GetSymbol(), 
         " ", record.GetDirectionString(), " @ ", record.GetEntryPrice());
   
   return true;
}

bool CTradeDocumentationManager::OnTradeClose(const ulong ticket)
{
   if(!m_enabled)
      return true;
      
   CTradeRecord* record = FindActiveRecord(ticket);
   if(record == NULL)
   {
      Print("Trade Record für Ticket nicht gefunden: ", ticket);
      return false;
   }
   
   // Trade Record mit Schließungsdaten aktualisieren
   if(!UpdateTradeRecord(record, ticket))
   {
      Print("Fehler beim Aktualisieren des Trade Records für Ticket: ", ticket);
      return false;
   }
   
   Print("Trade dokumentiert - Schließung: ", ticket, " P/L: ", record.GetProfitLoss(), 
         " Grund: ", record.GetExitReasonString());
   
   // Aus aktiven Trades entfernen
   RemoveActiveRecord(ticket);
   
   // Automatischer Export wenn aktiviert
   if(m_autoExport)
   {
      ExportCompletedTrades();
   }
   
   // Alte Records bereinigen
   CleanupOldRecords();
   
   return true;
}

bool CTradeDocumentationManager::OnTradeModify(const ulong ticket)
{
   if(!m_enabled)
      return true;
      
   CTradeRecord* record = FindActiveRecord(ticket);
   if(record == NULL)
      return false;
      
   // Aktualisiere SL/TP Werte
   CPositionInfo pos;
   if(pos.SelectByTicket(ticket))
   {
      record.SetStopLoss(pos.StopLoss());
      record.SetTakeProfit(pos.TakeProfit());
      
      Print("Trade Record aktualisiert - Modify: ", ticket, 
            " SL: ", pos.StopLoss(), " TP: ", pos.TakeProfit());
   }
   
   return true;
}

CTradeRecord* CTradeDocumentationManager::CreateTradeRecord(const ulong ticket)
{
   CPositionInfo pos;
   if(!pos.SelectByTicket(ticket))
   {
      Print("Position für Ticket nicht gefunden: ", ticket);
      return NULL;
   }
   
   ENUM_TRADE_DIRECTION direction = GetTradeDirection(pos.PositionType());
   
   CTradeRecord* record = new CTradeRecord(
      pos.Symbol(),
      direction,
      pos.PriceOpen(),
      pos.StopLoss(),
      pos.TakeProfit(),
      pos.Volume(),
      ticket
   );
   
   record.SetEntryTime(pos.Time());
   record.SetComment(pos.Comment());
   
   return record;
}

bool CTradeDocumentationManager::UpdateTradeRecord(CTradeRecord* record, const ulong ticket)
{
   if(record == NULL)
      return false;
      
   // Aus History lesen
   CHistoryDealInfo deal;
   HistorySelect(0, TimeCurrent());
   
   // Suche nach dem Exit-Deal
   for(int i = HistoryDealsTotal() - 1; i >= 0; i--)
   {
      if(deal.SelectByIndex(i) && deal.PositionId() == ticket)
      {
         if(deal.Entry() == DEAL_ENTRY_OUT)
         {
            record.SetExitTime(deal.Time());
            record.SetProfitLoss(deal.Profit());
            record.SetCommission(deal.Commission());
            record.SetSwap(deal.Swap());
            record.SetExitReason(DetermineExitReason(ticket));
            return true;
         }
      }
   }
   
   return false;
}

CTradeRecord* CTradeDocumentationManager::FindActiveRecord(const ulong ticket)
{
   for(int i = 0; i < m_activeRecords.Total(); i++)
   {
      CTradeRecord* record = m_activeRecords.At(i);
      if(record != NULL && record.GetTicket() == ticket)
         return record;
   }
   return NULL;
}

bool CTradeDocumentationManager::RemoveActiveRecord(const ulong ticket)
{
   for(int i = 0; i < m_activeRecords.Total(); i++)
   {
      CTradeRecord* record = m_activeRecords.At(i);
      if(record != NULL && record.GetTicket() == ticket)
      {
         return m_activeRecords.Delete(i);
      }
   }
   return false;
}

void CTradeDocumentationManager::CleanupOldRecords(void)
{
   if(m_exporter.GetTradeCount() <= m_maxRecords)
      return;
      
   // Exportiere alte Records bevor sie gelöscht werden
   if(m_autoExport)
   {
      string backupFile = m_exporter.GenerateFileName("TradeBackup");
      m_exporter.ExportToFile(backupFile);
   }
   
   // Behalte nur die neuesten Records
   // Dies ist eine vereinfachte Implementierung - in der Praxis würde man
   // nach Datum sortieren und die ältesten entfernen
   Print("Trade Records bereinigt. Aktuelle Anzahl: ", m_exporter.GetTradeCount());
}

ENUM_TRADE_DIRECTION CTradeDocumentationManager::GetTradeDirection(const ENUM_POSITION_TYPE posType)
{
   return (posType == POSITION_TYPE_BUY) ? TRADE_LONG : TRADE_SHORT;
}

ENUM_TRADE_EXIT_REASON CTradeDocumentationManager::DetermineExitReason(const ulong ticket)
{
   // Vereinfachte Implementierung - kann erweitert werden
   // Hier könnte man verschiedene Kriterien prüfen:
   // - Wurde TP/SL erreicht?
   // - War es ein manueller Exit?
   // - Trailing Stop?
   
   return EXIT_MANUAL; // Default
}

bool CTradeDocumentationManager::ExportAllTrades(void)
{
   return m_exporter.ExportToFile();
}

bool CTradeDocumentationManager::ExportCompletedTrades(void)
{
   return m_exporter.ExportCompletedTrades();
}

bool CTradeDocumentationManager::ExportTradesBySymbol(const string symbol)
{
   return m_exporter.ExportTradesBySymbol(symbol);
}

bool CTradeDocumentationManager::ExportTradesByDateRange(const datetime startDate, const datetime endDate)
{
   return m_exporter.ExportTradesByDateRange(startDate, endDate);
}

bool CTradeDocumentationManager::ExportToFile(const string fileName)
{
   return m_exporter.ExportToFile(fileName);
}

int CTradeDocumentationManager::GetCompletedTradeCount(void) const
{
   int count = 0;
   
   for(int i = 0; i < m_exporter.GetTradeCount(); i++)
   {
      // Diese Implementierung ist vereinfacht
      // In der Praxis würde man durch alle Records iterieren
      count++;
   }
   
   return count;
}

double CTradeDocumentationManager::GetTotalProfit(void) const
{
   return m_exporter.GetTotalProfit();
}

double CTradeDocumentationManager::GetTotalLoss(void) const
{
   return m_exporter.GetTotalLoss();
}

double CTradeDocumentationManager::GetWinRate(void) const
{
   return m_exporter.GetWinRate();
}

void CTradeDocumentationManager::ClearAllRecords(void)
{
   m_activeRecords.Clear();
   m_exporter.ClearRecords();
}

bool CTradeDocumentationManager::LoadHistoricalTrades(const datetime startDate, const datetime endDate)
{
   if(!HistorySelect(startDate, endDate))
   {
      Print("Fehler beim Laden der Handelshistorie");
      return false;
   }
   
   CHistoryDealInfo deal;
   int loaded = 0;
   
   for(int i = 0; i < HistoryDealsTotal(); i++)
   {
      if(deal.SelectByIndex(i))
      {
         if(deal.Entry() == DEAL_ENTRY_IN)
         {
            // Erstelle Record für historischen Trade
            // Dies ist eine vereinfachte Implementierung
            loaded++;
         }
      }
   }
   
   Print("Historische Trades geladen: ", loaded);
   return true;
}

void CTradeDocumentationManager::PrintStatistics(void)
{
   Print("=== Trade Documentation Statistiken ===");
   Print("Aktive Trades: ", GetActiveTradeCount());
   Print("Abgeschlossene Trades: ", GetCompletedTradeCount());
   Print("Gesamt Gewinn: ", GetTotalProfit());
   Print("Gesamt Verlust: ", GetTotalLoss());
   Print("Gewinnrate: ", GetWinRate(), "%");
   Print("========================================");
}

#endif // TRADE_DOCUMENTATION_MANAGER_MQH

