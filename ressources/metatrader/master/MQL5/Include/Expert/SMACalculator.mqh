#ifndef SMA_CALCULATOR_MQH
#define SMA_CALCULATOR_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\StatisticsManager.mqh>
#include <Expert\StatisticsCalculator.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Globals.mqh>

class CStatisticsCalculator;
class CStatisticsManager;

class CSMACalculator : public CStatisticsCalculator
{
public:
    virtual double Calculate(const CArrayObj* candles, int index, double period, double& additionalParams[], CStatisticsManager* manager);
};

double CSMACalculator::Calculate(const CArrayObj* candles, int index, double period, double& additionalParams[], CStatisticsManager* manager)
{
    if(index < period - 1)
        return EMPTY_VALUE;

    double sum = 0;
    for(int i = 0; i < period; i++)
    {
        CCandle* candle = candles.At(index - i);
        sum += candle.close;
    }
    return sum / period;
}

#endif

