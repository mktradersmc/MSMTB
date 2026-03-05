//+------------------------------------------------------------------+
//|                                         EMAConditionProvider.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "1.00"

#ifndef EMA_CONDITION_PROVIDER_MQH
#define EMA_CONDITION_PROVIDER_MQH

#include <Expert\IConditionProvider.mqh>
#include <Expert\StatisticsManager.mqh>
#include <Expert\ChartHelper.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Object.mqh>

class CEMAConditionProvider;

// Innere Klasse für die Instance-Daten
class CInstanceData : public CObject
{
public:
    string symbol;
    CEMAConditionProvider* instance;
    
    CInstanceData(string s, CEMAConditionProvider* i) : symbol(s), instance(i) {}
};

class CEMAConditionProvider : public IConditionProvider
{
private:
    static CArrayObj s_instances;
    string m_symbol;
    
    // Privater Konstruktor für Singleton
    CEMAConditionProvider(string symbol) : m_symbol(symbol) {}
    
    // Private Methode zum Finden einer Instanz
    static CEMAConditionProvider* FindInstance(string symbol)
    {
        for(int i = 0; i < s_instances.Total(); i++)
        {
            CInstanceData* data = s_instances.At(i);
            if(data.symbol == symbol)
                return data.instance;
        }
        return NULL;
    }
    
public:
    // Statische Methode zum Erhalt oder Erstellen einer Instanz
    static CEMAConditionProvider* GetInstance(string symbol)
    {
        CEMAConditionProvider* instance = FindInstance(symbol);
        if(instance == NULL)
        {
            instance = new CEMAConditionProvider(symbol);
            s_instances.Add(new CInstanceData(symbol, instance));
        }
        return instance;
    }
    
    // Implementation des IConditionProvider Interface
    virtual bool ValidateCondition(const string& params[]) override
    {
        if(ArraySize(params) < GetRequiredParameterCount())
            return false;
            
        // Parameter extrahieren
        string timeframeStr = params[0];
        int period = (int)StringToInteger(params[1]);
        string direction = params[2];
        
        // Timeframe konvertieren
        int timeframe = CChartHelper::StringToTimeframe(timeframeStr);
        if(timeframe == 0)
            return false;
            
        // Aktiviere EMA Statistik
        CStatisticsManager::GetInstance(m_symbol).ActivateStatistics(timeframe, STAT_EMA, period);
            
        // Hole aktuelle Kerze für das Timeframe
        CBaseChart* chart = CChartManager::GetInstance().GetChart(m_symbol, timeframe);
        if(chart == NULL)
            return false;
            
        CCandle* currentCandle = chart.getCandleAt(0);
        if(currentCandle == NULL)
            return false;
            
        // Hole EMA Wert
        double emaValue = CStatisticsManager::GetInstance(m_symbol).GetStatisticsValue(currentCandle, STAT_EMA, period);
        if(emaValue == EMPTY_VALUE)
            return false;
            
        // Vergleiche Close mit EMA basierend auf Direction
        if(direction == "BULLISH")
            return currentCandle.close > emaValue;
        else if(direction == "BEARISH")
            return currentCandle.close < emaValue;
            
        return false;
    }
    
    virtual string GetConditionDetails(const string& params[]) override
    {
        if(ArraySize(params) < GetRequiredParameterCount())
            return "Invalid parameters";
            
        string timeframeStr = params[0];
        int period = (int)StringToInteger(params[1]);
        string direction = params[2];
        
        int timeframe = CChartHelper::StringToTimeframe(timeframeStr);
        if(timeframe == 0)
            return "Invalid timeframe";
            
        CStatisticsManager::GetInstance(m_symbol).ActivateStatistics(timeframe, STAT_EMA, period);
            
        CBaseChart* chart = CChartManager::GetInstance().GetChart(m_symbol, timeframe);
        if(chart == NULL)
            return "Chart not available";
            
        CCandle* currentCandle = chart.getCandleAt(0);
        if(currentCandle == NULL)
            return "No candle data available";
            
        double emaValue = CStatisticsManager::GetInstance(m_symbol).GetStatisticsValue(currentCandle, STAT_EMA, period);
        if(emaValue == EMPTY_VALUE)
            return "EMA not calculated";
            
        return StringFormat("Close: %.5f, EMA(%d): %.5f, Direction: %s", 
            currentCandle.close,
            period,
            emaValue,
            direction);
    }
    
    virtual string GetConditionDescription(const string& params[]) override
    {
        if(ArraySize(params) < GetRequiredParameterCount())
            return "Invalid parameters";
            
        return StringFormat("Price is %s EMA(%s,%d)", 
            params[2] == "BULLISH" ? "above" : "below",
            params[0],
            (int)StringToInteger(params[1]));
    }
    
    virtual int GetRequiredParameterCount() override
    {
        return 3; // Timeframe, Period, Direction
    }
};

// Initialisierung der statischen Member-Variable
CArrayObj CEMAConditionProvider::s_instances;

#endif


