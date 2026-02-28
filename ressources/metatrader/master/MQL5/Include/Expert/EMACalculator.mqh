#ifndef EMA_CALCULATOR_MQH
#define EMA_CALCULATOR_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\StatisticsManager.mqh>
#include <Expert\StatisticsCalculator.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Globals.mqh>

class CStatisticsCalculator;
class CStatisticsManager;

class CEMACalculator : public CStatisticsCalculator
{
public:
    virtual double Calculate(const CArrayObj* candles, int index, double period, double& additionalParams[], CStatisticsManager* manager);
};

double CEMACalculator::Calculate(const CArrayObj* candles, int index, double period, double& additionalParams[], CStatisticsManager* manager)
{
    if(index < period - 1)
        return EMPTY_VALUE;

    CCandle* currentCandle = candles.At(index);
    double currentPrice = currentCandle.close;

    if(index == period - 1)
    {
        double sum = 0;
        for(int i = 0; i < period; i++)
        {
            CCandle* candle = candles.At(index - i);
            sum += candle.close;
        }
        return sum / period;
    }
    else
    {
        CCandle* previousCandle = candles.At(index - 1);
        double previousEMA = previousCandle.GetStatisticsValue(manager.GetMethodIndex(currentCandle.timeframe,STAT_EMA, period, additionalParams));
        double multiplier = 2.0 / (period + 1);
        return (currentPrice - previousEMA) * multiplier + previousEMA;
    }
}

#endif

