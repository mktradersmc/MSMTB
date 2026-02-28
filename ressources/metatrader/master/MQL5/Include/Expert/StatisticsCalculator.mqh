#ifndef STATISTICS_CALCULATOR_MQH
#define STATISTICS_CALCULATOR_MQH

#include <Arrays\ArrayObj.mqh>
#include <Object.mqh>

class CStatisticsManager;

class CStatisticsCalculator : public CObject
{
public:
    virtual double Calculate(const CArrayObj* candles, int index, double period, double& additionalParams[], CStatisticsManager* manager) = 0;
    
    CStatisticsCalculator() {}
    ~CStatisticsCalculator() {}
};
    
#endif
