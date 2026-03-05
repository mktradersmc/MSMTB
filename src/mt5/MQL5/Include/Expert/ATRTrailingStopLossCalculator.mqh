#ifndef ATR_TRAILING_STOPLOSS_CALCULATOR_MQH
#define ATR_TRAILING_STOPLOSS_CALCULATOR_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\StatisticsManager.mqh>
#include <Expert\StatisticsCalculator.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Globals.mqh>

class CStatisticsCalculator;
class CStatisticsManager;
class CCandle;

class CATRTrailingStopLossCalculator : public CStatisticsCalculator
{
private:
    double CalculateTR(const CArrayObj* candles, int index);

public:
    virtual double Calculate(const CArrayObj* candles, int index, double period, double& additionalParams[], CStatisticsManager* manager);
};

double CATRTrailingStopLossCalculator::Calculate(const CArrayObj* candles, int index, double period, double& additionalParams[], CStatisticsManager* manager)
{
    if(index < 1 || ArraySize(additionalParams) < 1)
        return EMPTY_VALUE;

    CCandle* candle = candles.At(index);
    CCandle* previous = candles.At(index - 1);

    double atrPeriod = additionalParams[0];  // ATR period is the first additional parameter

    // Ensure ATR is activated
    manager.ActivateStatistics(candle.timeframe, STAT_ATR, atrPeriod);

    // Get ATR value
    double atr = manager.GetStatisticsValue(candle, STAT_ATR, atrPeriod);
    
    // Calculate nLoss using period as keyFactor
    double nLoss = period * atr;

    double atrTrailingStop;

    if(index == 1)
    {
        atrTrailingStop = candle.close;
    }
    else
    {
        double prevATRTrailingStop = previous.GetStatisticsValue(manager.GetMethodIndex(candle.timeframe, STAT_ATR_TRAILING_STOP, period, additionalParams));
        
        if(candle.close > prevATRTrailingStop && previous.close > prevATRTrailingStop)
            atrTrailingStop = MathMax(prevATRTrailingStop, candle.close - nLoss);
        else if(candle.close < prevATRTrailingStop && previous.close < prevATRTrailingStop)
            atrTrailingStop = MathMin(prevATRTrailingStop, candle.close + nLoss);
        else
            atrTrailingStop = (candle.close > prevATRTrailingStop) ? candle.close - nLoss : candle.close + nLoss;
    }

    return atrTrailingStop;
}

#endif

