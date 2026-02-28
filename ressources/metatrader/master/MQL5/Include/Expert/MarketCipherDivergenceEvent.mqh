//+------------------------------------------------------------------+
//|                                  MarketCipherDivergenceEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict


#ifndef MARKETCIPHER_DIVERGENCE_EVENT_MQH
#define MARKETCIPHER_DIVERGENCE_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\MomentumWave.mqh>
#include <Expert\ChartHelper.mqh>

// CMarketCipherDivergenceEvent Class Definition
class CMarketCipherDivergenceEvent : public CEvent
{
private:
    int m_timeframe;
    CMomentumWave* anchorWave;
    CMomentumWave* triggerWave;

public:
    CMarketCipherDivergenceEvent(string symbol, int timeframe, CMomentumWave* anchor, CMomentumWave* trigger);
    CMomentumWave* GetAnchorWave() const;
    CMomentumWave* GetTriggerWave() const;
    int GetTimeframe();
    
    virtual int GetOriginTimeframe() const override;
    virtual string GetDetails() override;
    virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override;
};

// CMarketCipherDivergenceEvent Class Implementation
CMarketCipherDivergenceEvent::CMarketCipherDivergenceEvent(string symbol, int timeframe, CMomentumWave* anchor, CMomentumWave* trigger)
    : CEvent(symbol, EV_MARKET_CIPHER_DIVERGENCE),
      m_timeframe(timeframe),
      anchorWave(anchor),
      triggerWave(trigger) {}

CMomentumWave* CMarketCipherDivergenceEvent::GetAnchorWave() const { return anchorWave; }

CMomentumWave* CMarketCipherDivergenceEvent::GetTriggerWave() const { return triggerWave; }

int CMarketCipherDivergenceEvent::GetTimeframe() { return m_timeframe; }

int CMarketCipherDivergenceEvent::GetOriginTimeframe() const {
    return m_timeframe; 
}

string CMarketCipherDivergenceEvent::GetDetails()
{
    string result;
    
    result = getSymbol() + "." + CChartHelper::GetTimeframeName(m_timeframe) + 
             ": New Market Cipher " + (GetMarketDirection() == MARKET_DIRECTION_BULLISH ? "Bullish" : "Bearish") + 
             " Divergence";
    
    return result;
}

ENUM_MARKET_DIRECTION CMarketCipherDivergenceEvent::GetMarketDirection() const { 
    return anchorWave.IsValley() ? MARKET_DIRECTION_BULLISH : MARKET_DIRECTION_BEARISH;
}

#endif


