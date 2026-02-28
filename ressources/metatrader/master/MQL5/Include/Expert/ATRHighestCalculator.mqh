//+------------------------------------------------------------------+
//|                                         ATRHighestCalculator.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "1.00"

#ifndef ATR_HIGHEST_CALCULATOR_MQH
#define ATR_HIGHEST_CALCULATOR_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\StatisticsManager.mqh>
#include <Expert\StatisticsCalculator.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Globals.mqh>
#include <Expert\SymbolHelper.mqh>

class CStatisticsCalculator;
class CStatisticsManager;

class CATRHighestCalculator : public CStatisticsCalculator
{
private:    
    double GetHighestATR(const CArrayObj* candles, int index, double period, 
                        double lookback, CStatisticsManager* manager) {
        double highest = 0;
        double additionalParams[];
        CCandle* currentCandle = candles.At(index);
        
        int atrMethodIndex = manager.GetMethodIndex(
            currentCandle.timeframe, 
            STAT_ATR, 
            period, 
            additionalParams
        );
        
        for(int i = 0; i < lookback && index-i >= 0; i++) {
            CCandle* candle = candles.At(index - i);
            double atr = candle.GetStatisticsValue(atrMethodIndex);
            
            if(atr != EMPTY_VALUE && MathIsValidNumber(atr)) {
                atr = CSymbolHelper::NormalizePrice(atr, currentCandle.symbol);
                if(atr > highest) highest = atr;
            }
        }
        
        return highest > 0 ? highest : EMPTY_VALUE;
    }

public:
    virtual double Calculate(const CArrayObj* candles, int index, double period, 
                           double& additionalParams[], CStatisticsManager* manager) {
        if(index < period - 1)
            return EMPTY_VALUE;
            
        CCandle* currentCandle = candles.At(index);
        manager.ActivateStatistics(currentCandle.timeframe, STAT_ATR, period);
        
        double highestAtr = GetHighestATR(candles, index, period, period * 3, manager);
        return CSymbolHelper::NormalizePrice(highestAtr, currentCandle.symbol);
    }
};

#endif


