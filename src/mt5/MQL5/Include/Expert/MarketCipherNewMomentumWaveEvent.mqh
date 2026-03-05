//+------------------------------------------------------------------+
//|                                  MarketCipherDivergenceEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef MARKETCIPHER_NEW_MW_EVENT_MQH
#define MARKETCIPHER_NEW_MW_EVENT_MQH

#include <Expert\Event.mqh>
#include <Expert\MomentumWave.mqh>
#include <Expert\ChartHelper.mqh>

// CMarketCipherNewMomentumWaveEvent Class Definition
class CMarketCipherNewMomentumWaveEvent : public CEvent
{
private:
    int m_timeframe;
    CMomentumWave* momentumWave;

public:
    CMarketCipherNewMomentumWaveEvent(string symbol, int timeframe, CMomentumWave* momentumWave);
    CMomentumWave* GetMomentumWave() const;
    int GetTimeframe();
    
    virtual int GetOriginTimeframe() const override;
    virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override;
    virtual string GetDetails() override;
};

// CMarketCipherNewMomentumWaveEvent Class Implementation
CMarketCipherNewMomentumWaveEvent::CMarketCipherNewMomentumWaveEvent(string symbol, int timeframe, CMomentumWave* momentumWave)
    : CEvent(symbol, EV_MARKET_CIPHER_NEW_MOMENTUM_WAVE),
      m_timeframe(timeframe),
      momentumWave(momentumWave) {}

CMomentumWave* CMarketCipherNewMomentumWaveEvent::GetMomentumWave() const { return momentumWave; }
int CMarketCipherNewMomentumWaveEvent::GetTimeframe() { return m_timeframe; }

int CMarketCipherNewMomentumWaveEvent::GetOriginTimeframe() const {
    return m_timeframe; 
}

ENUM_MARKET_DIRECTION CMarketCipherNewMomentumWaveEvent::GetMarketDirection() const { 
    return momentumWave.IsValley() ? MARKET_DIRECTION_BULLISH : MARKET_DIRECTION_BEARISH;
}    

string CMarketCipherNewMomentumWaveEvent::GetDetails()
{
    string result;
    
    result = getSymbol() + "." + CChartHelper::GetTimeframeName(m_timeframe) + 
             ": New Market Cipher " + 
             (GetMarketDirection() == MARKET_DIRECTION_BULLISH ? "Bullish" : "Bearish") + 
             " Momentum Wave";
    
    return result;
}

#endif


