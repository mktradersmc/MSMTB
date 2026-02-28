#ifndef STANDARD_DEVIATION_CALCULATOR_MQH
#define STANDARD_DEVIATION_CALCULATOR_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\StatisticsManager.mqh>
#include <Expert\StatisticsCalculator.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Globals.mqh>

class CStatisticsCalculator;
class CStatisticsManager;

class CStandardDeviationCalculator : public CStatisticsCalculator
{
public:
    virtual double Calculate(const CArrayObj* candles, int index, double period, double& additionalParams[], CStatisticsManager* manager);
};

double CStandardDeviationCalculator::Calculate(const CArrayObj* candles, int index, double period, double& additionalParams[], CStatisticsManager* manager)
{
    int baseType = (int)additionalParams[0];
    int basePeriod = additionalParams[1];

    if(index < basePeriod - 1)
        return EMPTY_VALUE;

    // Ensure the base statistic (e.g., SMA, EMA) is activated
    CCandle* candle = candles.At(index);
    
    int timeframe = candle.timeframe;
    double baseAdditionalParams[]; // Empty array for base statistic
    manager.ActivateStatistics(timeframe, baseType, basePeriod, baseAdditionalParams);  

    double mean = manager.GetStatisticsValue(candle, baseType, basePeriod, baseAdditionalParams);
    
    // Calculate the sum of squared deviations from the mean
    double sumSquaredDeviations = 0;
    for(int i = 0; i < basePeriod; i++)
    {
        candle = candles.At(index - i);
        double deviation = candle.close - mean;
        sumSquaredDeviations += deviation * deviation;
    }

    // Step 4 & 5: Calculate the average of squared deviations
    double varianceForSample = sumSquaredDeviations / basePeriod;

    // Step 6: Take the square root to get the standard deviation
    return MathSqrt(varianceForSample)*period;
}

#endif

