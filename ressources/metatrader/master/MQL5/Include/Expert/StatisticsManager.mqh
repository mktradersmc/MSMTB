#ifndef STATISTICS_MANAGER_MQH
#define STATISTICS_MANAGER_MQH

#include <Expert\StatisticsCalculator.mqh>
#include <Expert\EMACalculator.mqh>
#include <Expert\SMACalculator.mqh>
#include <Expert\ATRCalculator.mqh>
#include <Expert\StandardDeviationCalculator.mqh>
#include <Expert\ATRTrailingStopLossCalculator.mqh>
#include <Expert\ATRHighestCalculator.mqh>
#include <Expert\ZLEMACalculator.mqh>
#include <Expert\ChartManager.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Globals.mqh>
#include <Object.mqh>

class CStatisticsCalculator;
class CStatisticsMethod;
class CEMACalculator;
class CSMACalculator;
class CATRCalculator;
class CStandardDeviationCalculator;
class CATRTrailingStopLossCalculator;
class CZLEMACalculator;
class CCandle;

// Wrapper-Klasse für Timeframe
class CTimeframe : public CObject
{
public:
    int timeframe;
    CTimeframe(int tf) : timeframe(tf) {}
};

class MethodInfo : public CObject
{
public:
    int timeframe;
    int type;
    double period;
    double additionalParams[];

    MethodInfo(int _timeframe, int _type, double _period, double& _additionalParams[])
        : timeframe(_timeframe), type(_type), period(_period)
    {
        ArrayCopy(additionalParams, _additionalParams);
    }

    bool Equals(const MethodInfo* other) const
    {
        return (timeframe == other.timeframe && type == other.type && period == other.period && 
                ArrayCompare(additionalParams, other.additionalParams) == 0);
    }
};

class CStatisticsManager
{
   class CInstanceData : public CObject
   {
   public:
      string symbol;
      CStatisticsManager* instance;
      
      CInstanceData(string s, CStatisticsManager* i) : symbol(s), instance(i) {}
   };
   
private:
    static CArrayObj s_instances;
    string m_symbol;
    CArrayObj m_timeframeMethods; 
    CStatisticsCalculator* m_calculators[];

    CStatisticsManager(string symbol);
    ~CStatisticsManager();

public:
    // Static method to get or create an instance
    static CStatisticsManager* GetInstance(string symbol);
    void ActivateStatistics(int timeframe, int type, double period);
    void ActivateStatistics(int timeframe, int type, double period, double& additionalParams[]);
    double GetStatisticsValue(CCandle* candle, int type, double period);
    double GetStatisticsValue(CCandle* candle, int type, double period, double& additionalParams[]);
    void Update(CCandle* candle);
    int GetMethodIndex(int timeframe, int type, double period, double& additionalParams[]);

private:
    // Private method to find instance
    static CStatisticsManager* FindInstance(string symbol);
    CArrayObj* GetTimeframeMethods(int timeframe);
    int FindMethod(CArrayObj* methods, int type, double period, double& additionalParams[]);
    void RecalculateStatistics(int timeframe, int type, double period, double& additionalParams[], int index);
    CArrayObj* GetCandlesForTimeframe(int timeframe);
    void PrintActivatedMethods();
};

// Initialize static member
CArrayObj CStatisticsManager::s_instances;

CStatisticsManager::CStatisticsManager(string symbol)
{
    m_symbol = symbol;
    // Initialize calculators
    ArrayResize(m_calculators, STAT_TOTAL); // Assuming 6 types of calculators
    m_calculators[0] = new CEMACalculator();
    m_calculators[1] = new CSMACalculator();
    m_calculators[2] = new CATRCalculator();
    m_calculators[3] = new CStandardDeviationCalculator();
    m_calculators[4] = new CATRTrailingStopLossCalculator();
    m_calculators[5] = new CZLEMACalculator();
    m_calculators[6] = new CATRHighestCalculator();
}


CStatisticsManager::~CStatisticsManager()
{
    for(int i = 0; i < ArraySize(m_calculators); i++)
    {
        delete m_calculators[i];
    }
    
    for(int i = 0; i < m_timeframeMethods.Total(); i++)
    {
        CArrayObj* timeframeMethods = m_timeframeMethods.At(i);
        for(int j = 0; j < timeframeMethods.Total(); j++)
        {
            delete timeframeMethods.At(j);
        }
        delete timeframeMethods;
    }
}

// Implementation of GetInstance method
CStatisticsManager* CStatisticsManager::GetInstance(string symbol)
{
   CStatisticsManager* instance = FindInstance(symbol);
   if (instance == NULL)
   {
      instance = new CStatisticsManager(symbol);
      CInstanceData* data = new CInstanceData(symbol, instance);
      s_instances.Add(data);
   }
   return instance;
}

// Implementation of FindInstance method
CStatisticsManager* CStatisticsManager::FindInstance(string symbol)
{
   for(int i = 0; i < s_instances.Total(); i++)
   {
      CInstanceData* data = s_instances.At(i);
      if(data.symbol == symbol)
         return data.instance;
   }
   return NULL;
}

void CStatisticsManager::ActivateStatistics(int timeframe, int type, double period)
{
    double emptyParams[];
    ActivateStatistics(timeframe,type,period,emptyParams);
}

void CStatisticsManager::ActivateStatistics(int timeframe, int type, double period, double& additionalParams[])
{
    CArrayObj* timeframeMethods = GetTimeframeMethods(timeframe);
    if(timeframeMethods == NULL)
    {
        timeframeMethods = new CArrayObj();
        m_timeframeMethods.Add(timeframeMethods);
    }
    
    int existingIndex = FindMethod(timeframeMethods, type, period, additionalParams);
    if(existingIndex == -1)
    {
        MethodInfo* info = new MethodInfo(timeframe, type, period, additionalParams);
        timeframeMethods.Add(info);
        Print("Methode "+CChartHelper::GetTimeframeName(timeframe)+"."+CChartHelper::GetStatisticsMethodName(type)+"("+period+") nicht gefunden. Berechne Historienwerte");
        
        // Recalculate statistics for all existing candles
        RecalculateStatistics(timeframe, type, period, additionalParams, timeframeMethods.Total() - 1);
    }
}

double CStatisticsManager::GetStatisticsValue(CCandle* candle, int type, double period)
{
    double emptyParams[];
    return GetStatisticsValue(candle,type,period,emptyParams);
}

double CStatisticsManager::GetStatisticsValue(CCandle* candle, int type, double period, double& additionalParams[])
{
    CArrayObj* timeframeMethods = GetTimeframeMethods(candle.timeframe);
    int index = FindMethod(timeframeMethods, type, period, additionalParams);
    if(index != -1)
    {
        return candle.GetStatisticsValue(index);
    }
    return EMPTY_VALUE;
}

CArrayObj* CStatisticsManager::GetTimeframeMethods(int timeframe)
{
    for(int i = 0; i < m_timeframeMethods.Total(); i++)
    {
        CArrayObj* timeframeArray = m_timeframeMethods.At(i);
        if(timeframeArray != NULL && timeframeArray.Total() > 0)
        {
            MethodInfo* firstMethod = timeframeArray.At(0);
            if(firstMethod != NULL && firstMethod.timeframe == timeframe)
                return timeframeArray;
        }
    }
    return NULL; // Return NULL if no methods found for this timeframe
}

void CStatisticsManager::Update(CCandle* candle)
{
    CArrayObj* timeframeMethods = GetTimeframeMethods(candle.timeframe);
    if(timeframeMethods == NULL || timeframeMethods.Total() == 0)
        return; // No activated methods for this timeframe

    CArrayObj* candles = GetCandlesForTimeframe(candle.timeframe);
    int candleIndex = candles.Total() - 1;

    for(int i = 0; i < timeframeMethods.Total(); i++)
    {
        MethodInfo* info = timeframeMethods.At(i);
        if(info != NULL && info.type >= 0 && info.type < ArraySize(m_calculators))
        {
            double value = m_calculators[info.type].Calculate(candles, candleIndex, info.period, info.additionalParams, GetInstance(m_symbol));
            candle.SetStatisticsValue(i, value);
        }
    }
}

void CStatisticsManager::PrintActivatedMethods()
{
    for(int i = 0; i < m_timeframeMethods.Total(); i++)
    {
        CArrayObj* timeframeMethods = m_timeframeMethods.At(i);
        if(timeframeMethods != NULL && timeframeMethods.Total() > 0)
        {
            MethodInfo* firstMethod = timeframeMethods.At(0);
            for(int j = 0; j < timeframeMethods.Total(); j++)
            {
                MethodInfo* method = timeframeMethods.At(j);
            }
        }
    }
}

int CStatisticsManager::FindMethod(CArrayObj* methods, int type, double period, double& additionalParams[])
{
    if(methods == NULL)
        return -1;

    for(int i = 0; i < methods.Total(); i++)
    {
        MethodInfo* current = methods.At(i);  
        if(current != NULL && 
           current.type == type && 
           current.period == period &&
           ArrayCompare(current.additionalParams, additionalParams) == 0)
        {
            return i;
        }
    }
    return -1;
}

void CStatisticsManager::RecalculateStatistics(int timeframe, int type, double period, double& additionalParams[], int index)
{
    CArrayObj* candles = GetCandlesForTimeframe(timeframe);
    for(int i = 0; i < candles.Total(); i++)
    {
        CCandle* candle = candles.At(i);
        double value = m_calculators[type].Calculate(candles, i, period, additionalParams, GetInstance(m_symbol));
        candle.SetStatisticsValue(index, value);
    }
}

int CStatisticsManager::GetMethodIndex(int timeframe, int type, double period, double& additionalParams[])
{
    CArrayObj* timeframeMethods = GetTimeframeMethods(timeframe);
    return FindMethod(timeframeMethods, type, period, additionalParams);
}

CArrayObj* CStatisticsManager::GetCandlesForTimeframe(int timeframe)
{
    return CChartManager::GetInstance().GetChart(m_symbol,timeframe).GetCandles();
}

#endif


