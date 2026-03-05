//+------------------------------------------------------------------+
//|                                                 HTFReversalEvent.mqh |
//|                                   Copyright 2025, Michael Müller    |
//|                                             https://www.mql5.com    |
//+------------------------------------------------------------------+
#property copyright "Copyright 2025, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef HTF_REVERSAL_EVENT_MQH
#define HTF_REVERSAL_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\SignalEvent.mqh>
#include <Expert\Candle.mqh>

// HTF-Reversal-Event: beschreibt ein strukturelles Reversal auf einem
// konzeptionellen Higher-Timeframe (z.B. H2/H3/H4), basierend auf H1-Daten.
class CHTFReversalEvent : public CSignalEvent
{
private:
   int      m_originTimeframe;   // Logischer HTF (z.B. PERIOD_H3)
   CCandle* m_triggerCandle;     // H1-Kerze, in der der Close-inside stattfindet
   double   m_prevHigh;          // High der aggregierten Vorgänger-HTF-Kerze
   double   m_prevLow;           // Low der aggregierten Vorgänger-HTF-Kerze
   bool     m_isBullish;         // true = Sweep unten, bullisches Reversal

public:
   CHTFReversalEvent(string symbol,
                     int originTimeframe,
                     CCandle* triggerCandle,
                     double prevHigh,
                     double prevLow,
                     bool isBullish);

   virtual ~CHTFReversalEvent() {}

   // Basisinformationen
   virtual int GetOriginTimeframe() const override { return m_originTimeframe; }
   virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override
   {
      return m_isBullish ? MARKET_DIRECTION_BULLISH : MARKET_DIRECTION_BEARISH;
   }

   CCandle* GetTriggerCandle() const { return m_triggerCandle; }
   double   GetPrevHigh()       const { return m_prevHigh; }
   double   GetPrevLow()        const { return m_prevLow; }

   virtual string GetDetails() override;
};

//--- Implementation
CHTFReversalEvent::CHTFReversalEvent(string symbol,
                                     int originTimeframe,
                                     CCandle* triggerCandle,
                                     double prevHigh,
                                     double prevLow,
                                     bool isBullish)
   : CSignalEvent(
        symbol,
        EV_HTF_REVERSAL_DETECTED,
        triggerCandle != NULL ? triggerCandle.close : 0.0, // Entry-Preis optional
        isBullish ? prevLow : prevHigh,                    // SL an Range-Grenze
        0,                                                 // TP optional
        EV_EMPTY                                           // Close-Event optional
     ),
     m_originTimeframe(originTimeframe),
     m_triggerCandle(triggerCandle),
     m_prevHigh(prevHigh),
     m_prevLow(prevLow),
     m_isBullish(isBullish)
{
}

string CHTFReversalEvent::GetDetails()
{
   string tfName = CChartHelper::GetTimeframeName(m_originTimeframe);
   string dir    = m_isBullish ? "Bullish" : "Bearish";

   string triggerTime = (m_triggerCandle != NULL)
                        ? CHelper::TimeToString(m_triggerCandle.closeTime)
                        : "n/a";

   return StringFormat("%s.%s HTF Reversal %s: PrevRange[%.5f - %.5f], TriggerClose %s",
                       m_symbol,
                       tfName,
                       dir,
                       m_prevLow,
                       m_prevHigh,
                       triggerTime);
}

#endif



