//+------------------------------------------------------------------+
//|                                 BollingerBandStrategyManager.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef BOLLINGER_BAND_MQH
#define BOLLINGER_BAND_MQH

#include <Expert\ChartManager.mqh>
#include <Expert\Candle.mqh>
#include <Expert\BBSignalEvent.mqh>
#include <Expert\StatisticsManager.mqh>

struct SBollingerBandValues
{
    double mean;
    double upper;
    double lower;
};

// CBollingerBand Klasse
class CBollingerBand
{
private:
    double m_meanType;
    double m_meanPeriod;
    double m_stdDevMultiplier;

public:
    // Konstruktor
    CBollingerBand(double meanType, double meanPeriod, double stdDevMultiplier)
        : m_meanType(meanType), m_meanPeriod(meanPeriod), m_stdDevMultiplier(stdDevMultiplier)
    {
    }

    // Methode zum Berechnen der Bollinger Band Werte für eine Kerze
    SBollingerBandValues Calculate(CCandle* candle)
    {
        // Aktiviere die notwendigen Statistiken
        double stdDevParams[] = {m_meanType, m_meanPeriod};
        CStatisticsManager::GetInstance(candle.symbol).ActivateStatistics(candle.timeframe, m_meanType, m_meanPeriod);
        CStatisticsManager::GetInstance(candle.symbol).ActivateStatistics(candle.timeframe, STAT_STDEV, m_stdDevMultiplier, stdDevParams);

        SBollingerBandValues result;
        
        result.mean = CStatisticsManager::GetInstance(candle.symbol).GetStatisticsValue(candle, m_meanType, m_meanPeriod);
        double stdDev = CStatisticsManager::GetInstance(candle.symbol).GetStatisticsValue(candle, STAT_STDEV, m_stdDevMultiplier, stdDevParams);
        
        result.upper = result.mean + stdDev;
        result.lower = result.mean - stdDev;

        return result;
    }

    // Getter-Methoden
    int GetMeanType() const { return m_meanType; }
    int GetMeanPeriod() const { return m_meanPeriod; }
    int GetStdDevMultiplier() const { return m_stdDevMultiplier; }
};

#endif


