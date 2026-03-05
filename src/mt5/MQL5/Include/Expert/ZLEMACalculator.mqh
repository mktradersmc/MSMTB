//+------------------------------------------------------------------+
//|                                              ZLEMACalculator.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "1.00"

#ifndef ZLEMA_CALCULATOR_MQH
#define ZLEMA_CALCULATOR_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\StatisticsManager.mqh>
#include <Expert\StatisticsCalculator.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Globals.mqh>
#include <Expert\SymbolHelper.mqh>

class CStatisticsCalculator;
class CStatisticsManager;

class CZLEMACalculator : public CStatisticsCalculator
{
private:
   int GetLag(double period);
   
public:
   virtual double Calculate(const CArrayObj* candles, int index, double period, 
                          double& additionalParams[], CStatisticsManager* manager);
};

//+------------------------------------------------------------------+
//| Berechnet den Lag-Wert basierend auf der Periode                  |
//+------------------------------------------------------------------+
int CZLEMACalculator::GetLag(double period)
{
   return (int)MathFloor((period - 1) / 2);
}

//+------------------------------------------------------------------+
//| Hauptberechnungsmethode für ZLEMA                                 |
//+------------------------------------------------------------------+
double CZLEMACalculator::Calculate(const CArrayObj* candles, int index, double period, 
                                double& additionalParams[], CStatisticsManager* manager)
{
   if(index < period - 1)
       return EMPTY_VALUE;
       
   int lag = GetLag(period);
   if(index < lag)
       return EMPTY_VALUE;
   
   CCandle* currentCandle = candles.At(index);
   CCandle* lagCandle = candles.At(index - lag);
   
   // Normalisiere die Preise
   double currentPrice = CSymbolHelper::NormalizePrice(currentCandle.close, currentCandle.symbol);
   double lagPrice = CSymbolHelper::NormalizePrice(lagCandle.close, currentCandle.symbol);
   
   // Berechne Zero-Lag Price mit normalisierten Werten
   double zeroLagPrice = CSymbolHelper::NormalizePrice(currentPrice + (currentPrice - lagPrice), currentCandle.symbol);
   
   if(index == period - 1) {
       // Erste Periode: Initialisierung mit SMA der Zero-Lag Preise
       double sum = 0;
       int count = 0;
       
       for(int i = 0; i < period; i++) {
           int currentIndex = index - i;
           if(currentIndex < lag) break;
           
           CCandle* candle = candles.At(currentIndex);
           CCandle* prevLagCandle = candles.At(currentIndex - lag);
           
           double price = CSymbolHelper::NormalizePrice(candle.close, candle.symbol);
           double prevLagPrice = CSymbolHelper::NormalizePrice(prevLagCandle.close, candle.symbol);
           
           sum += CSymbolHelper::NormalizePrice(price + (price - prevLagPrice), candle.symbol);
           count++;
       }
       
       return count > 0 ? CSymbolHelper::NormalizePrice(sum / count, currentCandle.symbol) : EMPTY_VALUE;
   }
   else {
       // Standard EMA Update Formel
       CCandle* previousCandle = candles.At(index - 1);
       double prevEma = previousCandle.GetStatisticsValue(
           manager.GetMethodIndex(currentCandle.timeframe, STAT_ZLEMA, period, additionalParams)
       );
       
       // Wenn der vorherige EMA ungültig ist, starten wir neu mit der Initialisierung
       if(prevEma == EMPTY_VALUE)
           return EMPTY_VALUE;
           
       double alpha = 2.0 / (period + 1.0);
       double newEma = CSymbolHelper::NormalizePrice(alpha * zeroLagPrice + (1.0 - alpha) * prevEma, currentCandle.symbol);
       
       return newEma;
   }
}

#endif


