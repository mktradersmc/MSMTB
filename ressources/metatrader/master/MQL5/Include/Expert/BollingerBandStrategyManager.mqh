//+------------------------------------------------------------------+
//|                                 BollingerBandStrategyManager.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef BOLLINGER_BAND_STRATEGY_MANAGER_MQH
#define BOLLINGER_BAND_STRATEGY_MANAGER_MQH

#include <Expert\ChartManager.mqh>
#include <Expert\Candle.mqh>
#include <Expert\BBSignalEvent.mqh>
#include <Expert\BollingerBand.mqh>
#include <Expert\StatisticsManager.mqh>
#include <Expert\ChartHelper.mqh>

class CBollingerBand;

class CBollingerBandStrategyManager : public CObject
{
private:
    int m_tradingTimeframe;
    int m_referenceTimeframe;
    CBollingerBand* m_tradingBB;    
    CBollingerBand* m_referenceBB;
    
    int m_idMeanCrossover;
    bool m_meanAbove;
    bool m_meanBelow;
    int m_idBorderCrossover;
    bool m_borderAbove;
    bool m_borderBelow;
    bool m_inLongTrade;
    bool m_inShortTrade;
    datetime m_lastProcessedTradingCande;

public:
    CBollingerBandStrategyManager(int tradingTimeframe = PERIOD_M5, int referenceTimeframe = PERIOD_M15)
        : m_tradingTimeframe(tradingTimeframe), m_referenceTimeframe(referenceTimeframe),
          m_inLongTrade(false), m_inShortTrade(false)
    {
        m_tradingBB = new CBollingerBand(STAT_EMA,20,2);
        m_referenceBB = new CBollingerBand(STAT_SMA,20,2); 
        m_idMeanCrossover = -1;
        m_meanAbove = false;
        m_meanBelow = false;
        m_idBorderCrossover = -1;
        m_borderAbove = false;
        m_borderBelow = false;     
    }

    void Update(CCandle* candle)
    {        
        bool debug = true;
        CBaseChart* tradingChart = CChartManager::GetInstance().GetChart(candle.symbol,m_tradingTimeframe);
        CBaseChart* referenceChart = CChartManager::GetInstance().GetChart(candle.symbol,m_referenceTimeframe);
        
        if (tradingChart != NULL && referenceChart != NULL && (candle.timeframe == m_tradingTimeframe || candle.timeframe == m_referenceTimeframe))
        {
            CCandle* tradingCandle = tradingChart.getCandleAt(0);
            CCandle* referenceCandle = referenceChart.getCandleAt(0);

            int referencePeriodInSeconds = CChartHelper::GetPeriodMinutes(m_referenceTimeframe) * 60;
            datetime expectedReferenceCloseTime = referenceCandle.closeTime + referencePeriodInSeconds;
            
            if (expectedReferenceCloseTime == tradingCandle.closeTime)
            {
                return;
            }
            
            if (m_lastProcessedTradingCande == tradingCandle.openTime)
               return;
               
            // Normale Verarbeitung, wenn wir nicht auf eine Referenzkerze warten                 
            SBollingerBandValues ctBB = m_tradingBB.Calculate(tradingCandle);
            SBollingerBandValues crBB = m_referenceBB.Calculate(referenceCandle);
                              
            // Überprüfung auf Signal
            bool meanCrossAbove = ctBB.mean >= crBB.mean && m_meanAbove == false;
            bool meanCrossBelow = ctBB.mean < crBB.mean && m_meanBelow == false;
              
             if (meanCrossAbove)
             {
                 m_meanBelow = false;
                 m_meanAbove = true;
                 m_idMeanCrossover = candle.id;
             }
             if (meanCrossBelow)
             {
                 m_meanAbove = false;
                 m_meanBelow = true;
                 m_idMeanCrossover = candle.id;
             }
              
             bool borderCrossAbove = ctBB.upper >= crBB.upper && m_borderAbove == false;
             bool borderCrossBelow = ctBB.lower <= crBB.lower && m_borderBelow == false;
   
             if (borderCrossAbove)
             {
                 m_borderAbove = true;
                 m_idBorderCrossover = candle.id;
             }
   
             if (ctBB.upper < crBB.upper)
             {
                 m_borderAbove = false;
                 m_idBorderCrossover = 0;
             }
                         
             if (borderCrossBelow)
             {
                 m_borderBelow = true;
                 m_idBorderCrossover = candle.id;
             }
              
             if (ctBB.lower > crBB.lower)
             {
                 m_borderBelow = false;
                 m_idBorderCrossover = 0;
             }
              
             bool buy = candle.close >= ctBB.upper && m_meanAbove && m_borderAbove && !m_inLongTrade;
             bool sell = candle.close <= ctBB.lower && m_meanBelow && m_borderBelow && !m_inShortTrade;
      
             bool closeBuy = ctBB.upper < crBB.mean && m_inLongTrade;
             bool closeSell = ctBB.lower > crBB.mean && m_inShortTrade;
   
             if (candle.id-m_idMeanCrossover>12 || m_idBorderCrossover-m_idMeanCrossover>12)
             {
                  buy = false;
                  sell = false;
             }
             
             // Erzeugung von Events
             if (buy)
             {
                 CBBSignalEvent* buyEvent = new CBBSignalEvent(tradingCandle.symbol, EV_BB_BUY_SIGNAL, candle, 0, crBB.mean, 0, EV_BB_CLOSE_BUY_SIGNAL);
                 CEventStore::GetInstance(tradingCandle.symbol).AddEvent(buyEvent);
                 m_inLongTrade = true;
                 m_inShortTrade = false;
                 CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,"Buy Signal generated at "+ CHelper::TimeToString(candle.openTime));
             }
             else if (sell)
             {
                 CBBSignalEvent* sellEvent = new CBBSignalEvent(tradingCandle.symbol, EV_BB_SELL_SIGNAL, candle, 0, crBB.mean, 0, EV_BB_CLOSE_SELL_SIGNAL);
                 CEventStore::GetInstance(tradingCandle.symbol).AddEvent(sellEvent);
                 m_inShortTrade = true;
                 m_inLongTrade = false;
                 CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,"Sell Signal generated at "+ CHelper::TimeToString(tradingCandle.openTime));
             }
              
             if (closeBuy)
             {
                 CBBSignalEvent* closeBuyEvent = new CBBSignalEvent(tradingCandle.symbol, EV_BB_CLOSE_BUY_SIGNAL, candle, 0, crBB.mean, 0, EV_EMPTY);
                 CEventStore::GetInstance(tradingCandle.symbol).AddEvent(closeBuyEvent);
                 m_inLongTrade = false;
                 CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,"Close Buy Signal generated at "+ CHelper::TimeToString(candle.openTime));
             }
             else if (closeSell)
             {
                 CBBSignalEvent* closeSellEvent = new CBBSignalEvent(tradingCandle.symbol, EV_BB_CLOSE_SELL_SIGNAL, candle, 0, crBB.mean, 0, EV_EMPTY);
                 CEventStore::GetInstance(tradingCandle.symbol).AddEvent(closeSellEvent);
                 m_inShortTrade = false;
                 CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,"Close Sell Signal generated at "+ CHelper::TimeToString(tradingCandle.openTime));
             }             
             
             CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,CChartHelper::GetTimeframeName(tradingCandle.timeframe)+"."+CHelper::TimeToString(tradingCandle.openTime)+" Bollinger Band Values");
             CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,"Mean = "+NormalizeDouble(ctBB.mean,5));
             CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,"Upper = "+NormalizeDouble(ctBB.upper,5));
             CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,"Lower = "+NormalizeDouble(ctBB.lower,5));
             CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,"Close = "+NormalizeDouble(tradingCandle.close,5));
          
             CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,CChartHelper::GetTimeframeName(referenceCandle.timeframe)+"."+CHelper::TimeToString(referenceCandle.openTime)+" Bollinger Band Values");
             CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,"Mean = "+NormalizeDouble(crBB.mean,5));
             CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,"Upper = "+NormalizeDouble(crBB.upper,5));
             CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,"Lower = "+NormalizeDouble(crBB.lower,5));
             CLogManager::GetInstance().LogMessage("CBollingerBandStrategyManager::Update",LL_DEBUG,"Close = "+NormalizeDouble(referenceCandle.close,5));             
             
             m_lastProcessedTradingCande = tradingCandle.openTime;
         }
    }
};

#endif


