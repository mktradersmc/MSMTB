//+------------------------------------------------------------------+
//|                                                    Imbalance.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.02"
#property strict

#ifndef IMBALANCE_MQH
#define IMBALANCE_MQH

#include <Expert\ITreeNode.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Helper.mqh>

enum ImbalanceType
{
   BULLISH,
   BEARISH
};

enum ImbalanceState
{
   ACTIVE,
   MITIGATED,
   FILLED,
   INVERTED,
   PENDING_INVERSION
};

struct TimeframeStatus
{
   int timeframe;
   bool hasEntered;
   double mitigationLevel;
};

class CImbalance : public ITreeNode
{
private:
   static ulong s_currentId;  // Statische Variable für ID-Generierung
   ulong m_uniqueId;         // Individuelle ID der Instanz
   
   // 2-Kerzen-Bestätigung für Invertierung
   int m_inversionConfirmationCount;
   double m_inversionBreachPrice;
   datetime m_inversionStartTime;

public:
   int timeframe;
   CCandle* associatedCandle;
   double originalGapHigh;
   double originalGapLow;
   ImbalanceType type;
   ImbalanceState state;
   bool isInverted;
   TimeframeStatus tfStatus[];
   
   CImbalance(int tf, CCandle* candle, double high, double low, ImbalanceType t);
   
   virtual double GetTreeValue() const override
   {
       return type == BULLISH ? originalGapLow : originalGapHigh;
   }
   
   ulong GetUniqueId() const { return m_uniqueId; }
   bool hasEntered(int tf);
   void setEntered(int tf, bool value);
   void invertType();
   string toString();

   // Methoden für Mitigation
   bool UpdateMitigatedLevel(double low, double high, int tf);
   double GetMitigationLevel(int timeframe);
   
   // Methoden für 2-Kerzen-Bestätigung
   void StartInversionConfirmation(double breachPrice, datetime time);
   bool AddInversionConfirmation(CCandle* candle);
   void ResetInversionConfirmation();
   bool IsConfirmed(int requiredCandles);
   
   // Getter für Bestätigung
   int GetInversionConfirmationCount() const { return m_inversionConfirmationCount; }
   double GetInversionBreachPrice() const { return m_inversionBreachPrice; }
   datetime GetInversionStartTime() const { return m_inversionStartTime; }
};

// Initialisierung der statischen Variable
ulong CImbalance::s_currentId = 0;

CImbalance::CImbalance(int tf, CCandle* candle, double high, double low, ImbalanceType t)
   : timeframe(tf), associatedCandle(candle), 
     originalGapHigh(high), originalGapLow(low),
     type(t), state(ACTIVE), isInverted(false),
     m_inversionConfirmationCount(0), m_inversionBreachPrice(0), m_inversionStartTime(0)
{
   m_uniqueId = ++s_currentId;  // Inkrementiere und weise zu
}

bool CImbalance::hasEntered(int tf)
{
   for(int i=0; i<ArraySize(tfStatus); i++)
   {
       if(tfStatus[i].timeframe == tf)
           return tfStatus[i].hasEntered;
   }
   return false;
}

void CImbalance::setEntered(int tf, bool value)
{
   for(int i=0; i<ArraySize(tfStatus); i++)
   {
       if(tfStatus[i].timeframe == tf)
       {
           tfStatus[i].hasEntered = value;
           return;
       }
   }
   
   int size = ArraySize(tfStatus);
   ArrayResize(tfStatus, size + 1);
   tfStatus[size].timeframe = tf;
   tfStatus[size].hasEntered = value;
   tfStatus[size].mitigationLevel = (type == BULLISH) ? originalGapHigh : originalGapLow;
}

double CImbalance::GetMitigationLevel(int timeframe) 
{
   for(int i = 0; i < ArraySize(tfStatus); i++)
   {
       if(tfStatus[i].timeframe == timeframe)
           return tfStatus[i].mitigationLevel;
   }
   
   // Wenn noch kein Status für dieses Timeframe existiert, Standardwert zurückgeben
   return (type == BULLISH) ? originalGapHigh : originalGapLow;
}

void CImbalance::invertType()
{
   type = (type == BULLISH) ? BEARISH : BULLISH;
   isInverted = !isInverted;
   
   // Bei Inversion für alle Timeframes das Mitigation Level zurücksetzen
   for(int i = 0; i < ArraySize(tfStatus); i++) {
       tfStatus[i].mitigationLevel = (type == BULLISH) ? originalGapHigh : originalGapLow;
       if (tfStatus[i].timeframe == PERIOD_M15 && timeframe == PERIOD_H4)
           Print("invertType: Mitigation Level Set to "+tfStatus[i].mitigationLevel);
   }
}

string CImbalance::toString()
{
   return StringFormat("%s%s%s Imbalance %d from %s with high = "+originalGapHigh+" and low = "+originalGapLow, 
       type == BULLISH ? "Bullish" : "Bearish",
       isInverted ? " (inverted) " : " ",
       CChartHelper::GetTimeframeName(timeframe),
       m_uniqueId,
       CHelper::TimeToString(associatedCandle.openTime));
}

bool CImbalance::UpdateMitigatedLevel(double low, double high, int tf)
{
   bool debug = tf == PERIOD_M15 && timeframe == PERIOD_H4;
   int index = -1;
   for(int i = 0; i < ArraySize(tfStatus); i++)
   {
       if(tfStatus[i].timeframe == tf)
       {
           index = i;
           break;
       }
   }
   
   if(index == -1)
   {
       int size = ArraySize(tfStatus);
       ArrayResize(tfStatus, size + 1);
       index = size;
       tfStatus[index].timeframe = tf;
       tfStatus[index].hasEntered = false;
       tfStatus[index].mitigationLevel = (type == BULLISH) ? originalGapHigh : originalGapLow;
   }
   
   bool levelChanged = false;
   
   if(type == BULLISH) {
       // Prüfe erst ob die Kerze überhaupt in die Imbalance eingedrungen ist
       if(low < originalGapHigh) {
           if(low <= originalGapLow) {
               if(tfStatus[index].mitigationLevel != originalGapLow) {
                   tfStatus[index].mitigationLevel = originalGapLow;
                   levelChanged = true;
               }
           } else if(low < tfStatus[index].mitigationLevel) {
               tfStatus[index].mitigationLevel = low;
               levelChanged = true;
           }
       }
   } else {
        // Prüfe erst ob die Kerze überhaupt in die Imbalance eingedrungen ist
       if(high > originalGapLow) {
           if(high >= originalGapHigh) {
               if(tfStatus[index].mitigationLevel != originalGapHigh) {
                   tfStatus[index].mitigationLevel = originalGapHigh;
                   levelChanged = true;
               }
           } else if(high > tfStatus[index].mitigationLevel) {
               tfStatus[index].mitigationLevel = high;
               levelChanged = true;
           }
       }
   }
   
   return levelChanged;
}

// 2-Kerzen-Bestätigung Implementierung
void CImbalance::StartInversionConfirmation(double breachPrice, datetime time)
{
   state = PENDING_INVERSION;
   m_inversionConfirmationCount = 1;
   m_inversionBreachPrice = breachPrice;
   m_inversionStartTime = time;
}

bool CImbalance::AddInversionConfirmation(CCandle* candle)
{
   if(state != PENDING_INVERSION || candle == NULL)
      return false;
      
   // Prüfe ob weitere Kerze außerhalb schließt
   bool isStillBroken = false;
   if(type == BULLISH) {
      isStillBroken = (candle.close < originalGapLow);
   } else {
      isStillBroken = (candle.close > originalGapHigh);
   }
   
   if(isStillBroken) {
      m_inversionConfirmationCount++;
      return true;
   } else {
      // Zurück in Imbalance - Reset ohne Event
      ResetInversionConfirmation();
      return false;
   }
}

void CImbalance::ResetInversionConfirmation()
{
   if(state == PENDING_INVERSION) {
      state = ACTIVE;
      m_inversionConfirmationCount = 0;
      m_inversionBreachPrice = 0;
      m_inversionStartTime = 0;
   }
}

bool CImbalance::IsConfirmed(int requiredCandles)
{
   return m_inversionConfirmationCount >= requiredCandles;
}

#endif // IMBALANCE_MQH

