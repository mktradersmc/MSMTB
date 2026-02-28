//+------------------------------------------------------------------+
//|                                          TradeLimitManager.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef TRADE_LIMIT_MANAGER_MQH
#define TRADE_LIMIT_MANAGER_MQH

#include <Object.mqh>
#include <Expert\StrategyExecutionInfo.mqh>

class CTradeLimitManager : public CObject
{
private:
    datetime m_lastReset;
    int m_totalDailyTrades;
    bool m_hadWinningTrade;

public:
    CTradeLimitManager();
    bool CanTakeNewTrade();
    void OnTradeClose(double profit);
    void Reset(); // Neue Reset-Methode
};

CTradeLimitManager::CTradeLimitManager() 
    : m_lastReset(0),
      m_totalDailyTrades(0),
      m_hadWinningTrade(false)
{
}

void CTradeLimitManager::Reset()
{
    m_totalDailyTrades = 0;
    m_hadWinningTrade = false;
    m_lastReset = TimeCurrent();
}

bool CTradeLimitManager::CanTakeNewTrade() 
{
    if(stop_after_win && m_hadWinningTrade)
        return false;
        
    if(max_daily_trades > 0 && m_totalDailyTrades >= max_daily_trades)
        return false;
        
    return true;
}

void CTradeLimitManager::OnTradeClose(double profit) 
{
    if(profit > 0)
        m_hadWinningTrade = true;
        
    m_totalDailyTrades++;
}

#endif

