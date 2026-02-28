//+------------------------------------------------------------------+
//|                                                 UTBotManager.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef UTBOT_MANAGER_MQH
#define UTBOT_MANAGER_MQH

#include <Expert\ChartManager.mqh>
#include <Expert\Candle.mqh>
#include <Expert\UTBotSignalEvent.mqh>
#include <Expert\StatisticsManager.mqh>

class CUTBotManager : public CObject
{
private:
    double m_keyFactor;
    double m_atrPeriod;

public:
    CUTBotManager(double keyFactor = 1.0, double atrPeriod = 2)
        : m_keyFactor(keyFactor), m_atrPeriod(atrPeriod) {}

    void Update(CCandle* candle)
    {
        double additionalParameters[] = { m_atrPeriod };
        CStatisticsManager::GetInstance(candle.symbol).ActivateStatistics(candle.timeframe,STAT_ATR,m_atrPeriod);
        CStatisticsManager::GetInstance(candle.symbol).ActivateStatistics(candle.timeframe,STAT_EMA,1);
        CStatisticsManager::GetInstance(candle.symbol).ActivateStatistics(candle.timeframe,STAT_ATR_TRAILING_STOP,m_keyFactor,additionalParameters);
 
        if (candle.id == 1)
         return;
         
        // Hole die vorherige Kerze
        CCandle* previous = CChartManager::GetInstance().GetChart(candle.symbol,candle.timeframe).getCandleById(candle.id - 1);

        // berechnung des ema
        double previousEma = CStatisticsManager::GetInstance(candle.symbol).GetStatisticsValue(previous,STAT_EMA,1);
        double previousAtrTrailingStop = CStatisticsManager::GetInstance(candle.symbol).GetStatisticsValue(previous,STAT_ATR_TRAILING_STOP,m_keyFactor,additionalParameters);
        double ema = CStatisticsManager::GetInstance(candle.symbol).GetStatisticsValue(candle,STAT_EMA,1);
        double atrTrailingStop = CStatisticsManager::GetInstance(candle.symbol).GetStatisticsValue(candle,STAT_ATR_TRAILING_STOP,m_keyFactor,additionalParameters);
         
        // Überprüfung auf Signale
        bool above = ema > atrTrailingStop && (previous == NULL || previousEma <= previousAtrTrailingStop);
        bool below = ema < atrTrailingStop && (previous == NULL || previousEma >= previousAtrTrailingStop);
        bool buy = candle.close > atrTrailingStop && above;
        bool sell = candle.close < atrTrailingStop && below;

        // Erzeugung von Events
        if (buy)
        {
            CUTBotSignalEvent* buyEvent = new CUTBotSignalEvent(candle.symbol, EV_UT_BOT_BUY_SIGNAL, candle);
            CEventStore::GetInstance(candle.symbol).AddEvent(buyEvent);
        }
        else if (sell)
        {
            CUTBotSignalEvent* sellEvent = new CUTBotSignalEvent(candle.symbol, EV_UT_BOT_SELL_SIGNAL, candle);
            CEventStore::GetInstance(candle.symbol).AddEvent(sellEvent);
        }
    }
};

#endif


