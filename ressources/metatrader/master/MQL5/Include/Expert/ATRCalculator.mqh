#ifndef ATR_CALCULATOR_MQH
#define ATR_CALCULATOR_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\StatisticsManager.mqh>
#include <Expert\StatisticsCalculator.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Globals.mqh>

class CStatisticsCalculator;
class CStatisticsManager;
class CCandle;

class CATRCalculator : public CStatisticsCalculator
{
private:
    double CalculateTR(const CArrayObj* candles, int index);

public:
    virtual double Calculate(const CArrayObj* candles, int index, double period, double& additionalParams[], CStatisticsManager* manager);
};

double CATRCalculator::CalculateTR(const CArrayObj* candles, int index)
{
    CCandle* currentCandle = candles.At(index);
    if(index == 0)
        return currentCandle.high - currentCandle.low;

    CCandle* previousCandle = candles.At(index - 1);
    return MathMax(currentCandle.high, previousCandle.close) - MathMin(currentCandle.low, previousCandle.close);
}

double CATRCalculator::Calculate(const CArrayObj* candles, int index, double period, double& additionalParams[], CStatisticsManager* manager)
{
    if(index < period - 1)
        return EMPTY_VALUE;

    double tr = CalculateTR(candles, index);

    if(index == period - 1)
    {
        double sum = 0;
        for(int i = 0; i < period; i++)
            sum += CalculateTR(candles, index - i);
        return sum / period;
    }
    else
    {
        CCandle* previousCandle = candles.At(index - 1);
        double previousATR = previousCandle.GetStatisticsValue(manager.GetMethodIndex(previousCandle.timeframe,STAT_ATR, period, additionalParams));
        return (previousATR * (period - 1) + tr) / period;
    }
}

#endif

