//+------------------------------------------------------------------+
//|                               MarketCipherMomentumShiftEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef MCMSE_MQH
#define MCMSE_MQH

#include <Expert\Event.mqh>
#include <Expert\MarketCipherManager.mqh>
#include <Expert\ChartHelper.mqh>

// CMarketCipherMomentumShiftEvent Class Definition
class CMarketCipherMomentumShiftEvent : public CEvent
{
private:
    int m_timeframe;
    ENUM_MOMENTUM oldMomentum;
    ENUM_MOMENTUM newMomentum;
    datetime shiftTime;

public:
    CMarketCipherMomentumShiftEvent(string symbol, int timeframe, ENUM_MOMENTUM oldMom, ENUM_MOMENTUM newMom, datetime time);
    ENUM_MOMENTUM GetOldMomentum() const;
    ENUM_MOMENTUM GetNewMomentum() const;
    datetime GetShiftTime() const;
    int GetTimeframe();
    
    virtual int GetOriginTimeframe() const override;
    virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override;
    virtual string GetDetails() override;
};

// CMarketCipherMomentumShiftEvent Class Implementation
CMarketCipherMomentumShiftEvent::CMarketCipherMomentumShiftEvent(string symbol, int timeframe, ENUM_MOMENTUM oldMom, ENUM_MOMENTUM newMom, datetime time)
    : CEvent(symbol, EV_MARKET_CIPHER_MOMENTUM_SHIFT),
      m_timeframe(timeframe),
      oldMomentum(oldMom),
      newMomentum(newMom),
      shiftTime(time) {}

ENUM_MOMENTUM CMarketCipherMomentumShiftEvent::GetOldMomentum() const { return oldMomentum; }
ENUM_MOMENTUM CMarketCipherMomentumShiftEvent::GetNewMomentum() const { return newMomentum; }
datetime CMarketCipherMomentumShiftEvent::GetShiftTime() const { return shiftTime; }
int CMarketCipherMomentumShiftEvent::GetTimeframe() { return m_timeframe; }

int CMarketCipherMomentumShiftEvent::GetOriginTimeframe() const {
    return m_timeframe; 
}

ENUM_MARKET_DIRECTION CMarketCipherMomentumShiftEvent::GetMarketDirection() const { 
    return newMomentum == MOMENTUM_Bullish ? MARKET_DIRECTION_BULLISH : MARKET_DIRECTION_BEARISH;
}    

string CMarketCipherMomentumShiftEvent::GetDetails()
{
    string result;
    
    result = getSymbol() + "." + CChartHelper::GetTimeframeName(GetOriginTimeframe()) + 
             " New Market Cipher Momentum Shift to " + 
             (GetMarketDirection() == MARKET_DIRECTION_BULLISH ? "Bullish" : "Bearish");
    
    return result;
}

#endif


