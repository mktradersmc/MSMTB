//+------------------------------------------------------------------+
//|                                             HTFReversalDetector.mqh |
//|                                   Copyright 2025, Michael Müller    |
//|                                             https://www.mql5.com    |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef HTF_REVERSAL_DETECTOR_MQH
#define HTF_REVERSAL_DETECTOR_MQH

#include <Expert\Feature.mqh>
#include <Expert\Candle.mqh>
#include <Expert\ChartManager.mqh>
#include <Expert\EventStore.mqh>
#include <Expert\HTFReversalEvent.mqh>
#include <Expert\EnvironmentManager.mqh>
#include <Expert\LogManager.mqh>
#include <Expert\ChartHelper.mqh>

// Kontext pro HTF (z.B. H1/H2/H3/H4), auf dem Reversals erkannt werden sollen.
class CHTFReversalContext : public CObject
{
public:
   int hours;               // Anzahl Stunden (1, 2, 3, 4, 5, 6, 8, 12)
   int lastSignalCandleId;  // Letzte H1-Candle-ID, für die ein Signal erzeugt wurde

   CHTFReversalContext(int h)
   {
      hours              = h;
      lastSignalCandleId = -1;
   }
};

// Detector für HTF-Reversals auf Basis von H1-Kerzen.
// Logik:
// - Für jeden konfigurierten HTF (aus aktiven Timeframes > H1) wird N = tf/H1 berechnet.
// - Auf H1-Basis wird ein gleitendes Fenster von 2N Kerzen betrachtet:
//   - Vorgänger-Block: N Kerzen → Range (prevHigh/prevLow)
//   - Folge-Block: N Kerzen → Sweep (High > prevHigh oder Low < prevLow) + Close-inside
// - Wenn die letzte Kerze des Folge-Blocks innerhalb der Range schließt und zuvor ein Sweep stattfand,
//   wird ein HTF-Reversal-Event (`EV_HTF_REVERSAL_DETECTED`) erzeugt.
class CHTFReversalDetector : public CFeature
{
private:
   CArrayObj* m_contexts;   // Array von CHTFReversalContext*

   void DetectForContext(CHTFReversalContext* ctx, CBaseChart* chart, CCandle* lastCandle);

public:
   CHTFReversalDetector()
   {
      m_contexts = new CArrayObj();
   }

   virtual ~CHTFReversalDetector()
   {
      if(m_contexts != NULL)
      {
         for(int i = 0; i < m_contexts.Total(); i++)
         {
            CHTFReversalContext* ctx = (CHTFReversalContext*)m_contexts.At(i);
            if(CheckPointer(ctx) == POINTER_DYNAMIC)
               delete ctx;
         }
         delete m_contexts;
         m_contexts = NULL;
      }
   }

   // CFeature-Interface
   virtual string GetName() override
   {
      return "HTFReversalDetector";
   }

   virtual void GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override
   {
      ArrayResize(eventTypes, 1);
      eventTypes[0] = EV_HTF_REVERSAL_DETECTED;
   }

   virtual void GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override
   {
      // Arbeitet nur mit Kursdaten, keine abhängigen Events nötig
      ArrayResize(eventTypes, 0);
   }

   virtual void GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override
   {
      ArrayResize(eventTypes, 0);
   }

   virtual void GetRequiredTimeframes(int& timeframes[]) override
   {
      // Detector braucht immer H1 als Basistimeframe
      ArrayResize(timeframes, 1);
      timeframes[0] = PERIOD_H1;
   }

   virtual void Initialize() override
   {
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_INFO, "=== HTFReversalDetector Initialize() gestartet ===");
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_INFO, "Feature-Name: " + GetName());
      
      // Hole die aktiven Timeframes aus dem EnvironmentManager
      // Diese werden aktiviert, wenn Strategien EV_HTF_REVERSAL_DETECTED mit einem Origin-Timeframe verwenden
      int activeTimeframes[];
      CEnvironmentManager::GetInstance().GetActiveTimeframes(activeTimeframes);
      
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_INFO, "Aktive Timeframes: " + IntegerToString(ArraySize(activeTimeframes)));
      
      int h1Seconds = PeriodSeconds((ENUM_TIMEFRAMES)PERIOD_H1);
      if(h1Seconds <= 0)
      {
         CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_INFO, "FEHLER: H1 PeriodSeconds ungültig (" + IntegerToString(h1Seconds) + "). Keine Contexts erstellt.");
         return;
      }
      
      // Prüfe jeden aktiven Timeframe und erstelle Contexts nur für Stunden-Timeframes (H1, H2, H3, etc.)
      for(int i = 0; i < ArraySize(activeTimeframes); i++)
      {
         int tf = activeTimeframes[i];
         string tfName = CChartHelper::GetTimeframeName(tf);
         
         // Nur Stunden-Timeframes prüfen (H1 bis H12, aber nicht Daily etc.)
         if(tf < PERIOD_H1 || tf > PERIOD_H12)
         {
            CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Timeframe " + tfName + " übersprungen: Kein Stunden-Timeframe (H1-H12)");
            continue;
         }
         
         int tfSeconds = PeriodSeconds((ENUM_TIMEFRAMES)tf);
         if(tfSeconds <= 0)
         {
            CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Timeframe " + tfName + " übersprungen: PeriodSeconds ungültig (" + IntegerToString(tfSeconds) + ")");
            continue;
         }

         // Prüfe, ob es ein ganzzahliges Vielfaches von H1 ist
         if(tfSeconds % h1Seconds != 0)
         {
            CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Timeframe " + tfName + " übersprungen: kein ganzzahliges Vielfaches von H1 (H1=" + IntegerToString(h1Seconds) + "s, TF=" + IntegerToString(tfSeconds) + "s)");
            continue;
         }

         // Berechne die Anzahl Stunden (H1-Kerzen pro virtueller HTF-Kerze)
         int hours = tfSeconds / h1Seconds;
         if(hours < 1)
         {
            CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Timeframe " + tfName + " übersprungen: hours < 1 (" + IntegerToString(hours) + ")");
            continue;
         }

         CHTFReversalContext* ctx = new CHTFReversalContext(hours);
         m_contexts.Add(ctx);
         CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_INFO, "Context erstellt für " + tfName + " (" + IntegerToString(hours) + " H1-Kerzen pro virtueller HTF-Kerze)");
      }
      
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_INFO, "Initialize() abgeschlossen. Anzahl Contexts: " + IntegerToString(m_contexts.Total()));
      
      if(m_contexts.Total() == 0)
      {
         CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_INFO, "HINWEIS: Keine Contexts erstellt! Stelle sicher, dass deine Strategie EV_HTF_REVERSAL_DETECTED mit einem Origin-Timeframe (H1-H12) verwendet.");
      }
   }

   virtual void Update(CCandle* candle) override
   {
      // Nur H1-Kerzen verarbeiten
      if(candle == NULL || candle.timeframe != PERIOD_H1)
         return;

      if(m_contexts == NULL || m_contexts.Total() == 0)
         return;

      CBaseChart* chart = CChartManager::GetInstance().GetChart(candle.symbol, PERIOD_H1);
      if(chart == NULL)
         return;

      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Update() verarbeitet H1-Kerze: ID=" + IntegerToString(candle.id) + ", Time=" + TimeToString(candle.openTime) + ", OHLC=" + DoubleToString(candle.open, _Digits) + "/" + DoubleToString(candle.high, _Digits) + "/" + DoubleToString(candle.low, _Digits) + "/" + DoubleToString(candle.close, _Digits));

      for(int i = 0; i < m_contexts.Total(); i++)
      {
         CHTFReversalContext* ctx = (CHTFReversalContext*)m_contexts.At(i);
         DetectForContext(ctx, chart, candle);
      }
   }

   virtual void ProcessEvents() override
   {
      // Keine nachgelagerte Eventverarbeitung nötig, alles direkt in Update
   }

   virtual void Deinitialize() override
   {
      // Cleanup erfolgt im Destruktor
   }
};

//--- Reversal-Erkennung für einen Kontext
// Logik: 
// - Virtuelle HTF-Kerze 1 (Vorgänger): Die letzten N H1-Kerzen (inkl. aktueller)
// - Virtuelle HTF-Kerze 2 (davor): Die N H1-Kerzen davor
// - Prüfe: Hat Kerze 1 das High/Low von Kerze 2 gesweept? Und schließt aktuelle H1-Kerze innerhalb der Range von Kerze 2?
void CHTFReversalDetector::DetectForContext(CHTFReversalContext* ctx, CBaseChart* chart, CCandle* lastCandle)
{
   if(ctx == NULL || chart == NULL || lastCandle == NULL)
   {
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "DetectForContext() übersprungen: NULL-Parameter");
      return;
   }

   int N = ctx.hours;  // Anzahl Stunden = Anzahl H1-Kerzen pro virtueller HTF-Kerze
   
   CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "--- DetectForContext() für H" + IntegerToString(N) + " ---");
   CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Aktuelle H1-Kerze: ID=" + IntegerToString(lastCandle.id) + ", Time=" + TimeToString(lastCandle.openTime) + ", Close=" + DoubleToString(lastCandle.close, _Digits));
   
   if(N <= 0)
   {
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Übersprungen: hours <= 0");
      return;
   }

   // Wir benötigen mindestens 2N H1-Kerzen (N für virtuelle Kerze 1, N für virtuelle Kerze 2)
   int minRequiredId = 2 * N - 1;
   if(lastCandle.id < minRequiredId)
   {
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Übersprungen: Nicht genug Kerzen vorhanden (benötigt: ID >= " + IntegerToString(minRequiredId) + ", aktuell: ID=" + IntegerToString(lastCandle.id) + ")");
      return;
   }

   if(ctx.lastSignalCandleId == lastCandle.id)
   {
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Übersprungen: Bereits Signal für diese Kerze erzeugt (ID=" + IntegerToString(lastCandle.id) + ")");
      return;
   }

   // Virtuelle HTF-Kerze 1 (Vorgänger): Die letzten N H1-Kerzen (inkl. aktueller)
   int startVirtual1 = lastCandle.id - N + 1;
   int endVirtual1   = lastCandle.id;
   
   // Virtuelle HTF-Kerze 2 (davor): Die N H1-Kerzen davor
   int startVirtual2 = lastCandle.id - 2 * N + 1;
   int endVirtual2   = lastCandle.id - N;

   CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Virtuelle HTF-Kerze 1 (Vorgänger): H1-Kerzen ID " + IntegerToString(startVirtual1) + " bis " + IntegerToString(endVirtual1) + " (" + IntegerToString(N) + " Kerzen)");
   CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Virtuelle HTF-Kerze 2 (davor): H1-Kerzen ID " + IntegerToString(startVirtual2) + " bis " + IntegerToString(endVirtual2) + " (" + IntegerToString(N) + " Kerzen)");

   // Range der virtuellen HTF-Kerze 2 bestimmen (davor)
   double virtual2High = -DBL_MAX;
   double virtual2Low  = DBL_MAX;

   for(int i = startVirtual2; i <= endVirtual2; i++)
   {
      CCandle* c = chart.getCandleById(i);
      if(c == NULL)
      {
         CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "FEHLER: Kerze ID=" + IntegerToString(i) + " für virtuelle HTF-Kerze 2 nicht gefunden");
         return;
      }

      if(c.high > virtual2High)
         virtual2High = c.high;
      if(c.low < virtual2Low)
         virtual2Low = c.low;
   }

   if(virtual2High == -DBL_MAX || virtual2Low == DBL_MAX)
   {
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Übersprungen: Range von virtueller HTF-Kerze 2 ungültig");
      return;
   }

   CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Virtuelle HTF-Kerze 2 Range: High=" + DoubleToString(virtual2High, _Digits) + ", Low=" + DoubleToString(virtual2Low, _Digits) + " (Range: " + DoubleToString(virtual2Low, _Digits) + " - " + DoubleToString(virtual2High, _Digits) + ")");

   // Prüfe: Hat virtuelle HTF-Kerze 1 (Vorgänger) das High/Low von virtueller HTF-Kerze 2 gesweept?
   bool sweptHigh = false;
   bool sweptLow  = false;

   for(int i = startVirtual1; i <= endVirtual1; i++)
   {
      CCandle* c = chart.getCandleById(i);
      if(c == NULL)
      {
         CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "FEHLER: Kerze ID=" + IntegerToString(i) + " für virtuelle HTF-Kerze 1 nicht gefunden");
         return;
      }

      if(c.high > virtual2High)
      {
         sweptHigh = true;
         CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Sweep High erkannt: Kerze ID=" + IntegerToString(i) + " High=" + DoubleToString(c.high, _Digits) + " > virtual2High=" + DoubleToString(virtual2High, _Digits));
      }
      if(c.low < virtual2Low)
      {
         sweptLow = true;
         CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Sweep Low erkannt: Kerze ID=" + IntegerToString(i) + " Low=" + DoubleToString(c.low, _Digits) + " < virtual2Low=" + DoubleToString(virtual2Low, _Digits));
      }
   }

   CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Sweep-Ergebnis: sweptHigh=" + (sweptHigh ? "true" : "false") + ", sweptLow=" + (sweptLow ? "true" : "false"));

   // Close-inside-Bedingung: Aktuelle H1-Kerze muss innerhalb der Range von virtueller HTF-Kerze 2 schließen
   bool closeInside = (lastCandle.close < virtual2High && lastCandle.close > virtual2Low);
   CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Close-inside-Prüfung: Close=" + DoubleToString(lastCandle.close, _Digits) + ", Range=" + DoubleToString(virtual2Low, _Digits) + "-" + DoubleToString(virtual2High, _Digits) + " → " + (closeInside ? "ERFÜLLT" : "NICHT ERFÜLLT"));
   
   if(!closeInside)
   {
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Übersprungen: Close-inside-Bedingung nicht erfüllt");
      return;
   }

   // Richtung bestimmen
   bool isBullish = false;

   if(sweptLow && !sweptHigh)
   {
      isBullish = true;        // Sweep unten → bullisches Reversal
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Richtung: BULLISH (nur Low gesweept)");
   }
   else if(sweptHigh && !sweptLow)
   {
      isBullish = false;       // Sweep oben → bärisches Reversal
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Richtung: BEARISH (nur High gesweept)");
   }
   else if(sweptHigh && sweptLow)
   {
      // Ambigu: einfache Heuristik → Richtung anhand Kerzenkörper
      isBullish = lastCandle.isUpCandle();
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Richtung: AMBIGU (beide gesweept) → Heuristik: " + (isBullish ? "BULLISH" : "BEARISH") + " (Kerze ist " + (lastCandle.isUpCandle() ? "UP" : "DOWN") + ")");
   }
   else
   {
      // Kein Sweep
      CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_DEBUG, "Übersprungen: Kein Sweep erkannt (sweptHigh=" + (sweptHigh ? "true" : "false") + ", sweptLow=" + (sweptLow ? "true" : "false") + ")");
      return;
   }

   // Timeframe für Event bestimmen (z.B. PERIOD_H3 für 3 Stunden)
   // Hinweis: PERIOD_H5 existiert nicht in MQL5, verwende PERIOD_H4 als Fallback
   int eventTimeframe = PERIOD_H1;
   if(N == 2) eventTimeframe = PERIOD_H2;
   else if(N == 3) eventTimeframe = PERIOD_H3;
   else if(N == 4) eventTimeframe = PERIOD_H4;
   else if(N == 5) eventTimeframe = PERIOD_H4;  // PERIOD_H5 existiert nicht, verwende H4
   else if(N == 6) eventTimeframe = PERIOD_H6;
   else if(N == 8) eventTimeframe = PERIOD_H8;
   else if(N == 12) eventTimeframe = PERIOD_H12;

   CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_INFO, "*** HTF REVERSAL ERKANNT für H" + IntegerToString(N) + " ***");
   CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_INFO, "Richtung: " + (isBullish ? "BULLISH" : "BEARISH") + ", Trigger-Kerze: ID=" + IntegerToString(lastCandle.id) + ", Time=" + TimeToString(lastCandle.openTime) + ", Close=" + DoubleToString(lastCandle.close, _Digits));
   CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_INFO, "Virtuelle HTF-Kerze 2 Range: " + DoubleToString(virtual2Low, _Digits) + " - " + DoubleToString(virtual2High, _Digits));

   CHTFReversalEvent* ev = new CHTFReversalEvent(
      lastCandle.symbol,
      eventTimeframe,
      lastCandle,
      virtual2High,
      virtual2Low,
      isBullish
   );

   CEventStore::GetInstance(lastCandle.symbol).AddEvent(ev);
   ctx.lastSignalCandleId = lastCandle.id;
   
   CLogManager::GetInstance().LogMessage("CHTFReversalDetector", LL_INFO, "Event erstellt und zum EventStore hinzugefügt: " + ev.GetDetails());
}

#endif



