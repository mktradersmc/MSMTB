//+------------------------------------------------------------------+
//|                                        StrategyExecutionInfo.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef STRATEGY_EXECUTION_INFO_MQH
#define STRATEGY_EXECUTION_INFO_MQH

#include <Object.mqh>

enum ENUM_TRADE_LIMIT_MODE {
   TL_UNLIMITED = 0,        // Unbegrenzt
   TL_PER_STRATEGY = 1,     // Pro Strategie
   TL_PER_DIRECTION = 2     // Pro Strategie und Richtung
};

// Input parameters for Trade Limits (extern variables)
input group "Trade Limits"
input ENUM_TRADE_LIMIT_MODE trade_limit_mode = TL_UNLIMITED; // Trade Limit Modus
input int max_trades_per_strategy = 1; // Max. Trades pro Strategie(/Richtung)
input bool allow_reentries = false; // Reentries erlauben
input int max_reentries = 1; // Max. Anzahl Reentries
input int max_daily_trades = 0; // Max. Trades pro Tag (0 = unbegrenzt)
input bool stop_after_win = false; // Nach Gewinn-Trade stoppen

class CStrategyExecutionInfo : public CObject
{
private:
    string m_strategyName;
    bool m_isLong;
    int m_maxEntries;
    int m_currentEntries;
    int m_currentReentries;
    bool m_hadWinningTrade;

public:
    CStrategyExecutionInfo(const string strategyName, bool isLong, int maxEntries);
    bool Matches(const string strategyName, bool isLong) const;
    bool CanTakeNewEntry() const;
    void IncrementEntries();
    void IncrementReentries();
    bool CanReenter() const;
    string GetStrategyName() const;
    bool IsLong() const;
    void Reset();
    void SetWinningTrade();
};

CStrategyExecutionInfo::CStrategyExecutionInfo(const string strategyName, bool isLong, int maxEntries)
    : m_strategyName(strategyName),
      m_isLong(isLong),
      m_maxEntries(maxEntries),
      m_currentEntries(0),
      m_currentReentries(0),
      m_hadWinningTrade(false)
{
}

void CStrategyExecutionInfo::Reset()
{
    Print("Reset Strategy Execution Info for "+m_strategyName+(m_isLong?" Long":" Short"));
    m_currentEntries = 0;
    m_currentReentries = 0;
    m_hadWinningTrade = false;
}

bool CStrategyExecutionInfo::Matches(const string strategyName, bool isLong) const 
{
    if(trade_limit_mode == TL_PER_DIRECTION)
        return m_strategyName == strategyName && m_isLong == isLong;
    return m_strategyName == strategyName;
}

bool CStrategyExecutionInfo::CanTakeNewEntry() const 
{
    string direction = "";
    
    if(trade_limit_mode == TL_UNLIMITED) return true;
    
    if(stop_after_win && m_hadWinningTrade)
    {
        Print("No new entries allowed after winning trade for strategy " + m_strategyName);
        return false;
    }
    
    if(trade_limit_mode == TL_PER_DIRECTION)
       direction = (m_isLong?" Long":" Short");
    Print("Current Entries for "+m_strategyName+direction+" = "+m_currentEntries);
    return m_currentEntries < m_maxEntries;
}

void CStrategyExecutionInfo::IncrementEntries() 
{
    m_currentEntries++;
}

void CStrategyExecutionInfo::IncrementReentries() 
{
    m_currentReentries++;
}

bool CStrategyExecutionInfo::CanReenter() const 
{
    if(stop_after_win && m_hadWinningTrade)
    {
        Print("No new entries allowed after winning trade for strategy " + m_strategyName);
        return false;
    }

    return allow_reentries && m_currentReentries < max_reentries;
}

string CStrategyExecutionInfo::GetStrategyName() const 
{ 
    return m_strategyName; 
}

bool CStrategyExecutionInfo::IsLong() const 
{ 
    return m_isLong; 
}

void CStrategyExecutionInfo::SetWinningTrade()
{
    m_hadWinningTrade = true;
}

#endif
