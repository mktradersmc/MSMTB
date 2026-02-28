//+------------------------------------------------------------------+
//|                                                        Event.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef EVENT_MQH
#define EVENT_MQH

#include <Object.mqh>
#include <Expert\Helper.mqh>
#include <Expert\Globals.mqh>
#include <Expert\ChartHelper.mqh>

enum ENUM_EVENT_TYPE {
   EV_EMPTY = -1,
   EV_NEW_CANDLE = 0,
   EV_HIGH_BROKEN = 1,
   EV_LOW_BROKEN = 2,
   EV_HIGH_CREATED = 3,
   EV_LOW_CREATED = 4,
   EV_HIGH_SWEPT = 5,
   EV_LOW_SWEPT = 6,
   EV_IMBALANCE_CREATED = 7,
   EV_IMBALANCE_INVERTED = 11,
   EV_IMBALANCE_ENTERED = 8,
   EV_IMBALANCE_LEFT = 10,
   EV_IMBALANCE_MITIGATED = 12,
   EV_IMBALANCE_DEACTIVATED = 9,
   EV_MARKET_CIPHER_DIVERGENCE = 13,
   EV_MARKET_CIPHER_NEW_MOMENTUM_WAVE = 14,
   EV_MARKET_CIPHER_MOMENTUM_SHIFT = 15,
   EV_ACTIVATE_TRADING = 16,
   EV_DEACTIVATE_TRADING = 17,
   EV_IMBALANCE_MOVEMENT = 18,
   EV_HEIKINASHI_NEW_CANDLE = 19,
   EV_HEIKINASHI_TREND_CHANGE = 20,
   EV_HIGH_LEVEL_SWEPT = 21,
   EV_LOW_LEVEL_SWEPT = 22,
   EV_HIGH_LEVEL_BROKEN = 23,
   EV_LOW_LEVEL_BROKEN = 24,
   EV_PRICE_LEVEL_CREATED = 25,
   EV_UT_BOT_BUY_SIGNAL = 26,
   EV_UT_BOT_SELL_SIGNAL = 27,
   EV_SESSION_STARTED = 28,
   EV_SESSION_ENDED = 29,
   EV_BB_BUY_SIGNAL = 30,
   EV_BB_SELL_SIGNAL = 31,
   EV_BB_CLOSE_BUY_SIGNAL = 32,
   EV_BB_CLOSE_SELL_SIGNAL = 33,
   EV_INVERTED_IMBALANCE_ENTERED = 34,
   EV_INVERTED_IMBALANCE_LEFT = 35,
   EV_INVERTED_IMBALANCE_MITIGATED = 36,
   EV_INVERTED_IMBALANCE_MOVEMENT = 37,
   EV_BULLISH_DIVERGENCE_DETECTED = 38,
   EV_BEARISH_DIVERGENCE_DETECTED = 39,
   EV_HIGH_LEVEL_MITIGATED = 40,
   EV_LOW_LEVEL_MITIGATED = 41,
   EV_HIGH_MITIGATED= 42,
   EV_LOW_MITIGATED = 43,
   EV_TRADE_STOPLOSS_HIT = 44,
   EV_TRADE_TAKEPROFIT_HIT = 45,
   EV_BULLISH_DIVERGENCE_RESOLVED = 46,
   EV_BEARISH_DIVERGENCE_RESOLVED = 47,
   EV_TREND_CHANGE_BULLISH = 48,
   EV_TREND_CHANGE_BEARISH = 49,
   EV_TREND_BULLISH_ENTRY_SIGNAL = 50,
   EV_TREND_BEARISH_ENTRY_SIGNAL = 51,
   EV_TRADE_BREAKEVEN_HIT = 52,
   EV_TRADE_SETUP_INVALIDATED = 53,
   EV_TRADE_PARTIAL_CLOSE = 54,
   EV_IMBALANCE_DISRESPECTED = 55,
   EV_IMBALANCE_INVERSION_CONFIRMED = 84,
   EV_MARKET_REVERSAL = 56,
   EV_UNMITIGATED_IMBALANCE_ENTERED = 57,
   EV_UNMITIGATED_INVERTED_IMBALANCE_ENTERED = 58,
   EV_MARKET_STRUCTURE_BOS = 59,
   EV_MARKET_STRUCTURE_CHOCH = 60,
   EV_PRICE_ACTION_REVERSAL = 61,  
   EV_PRICE_ACTION_POTENTIAL_REVERSAL = 62,
   EV_SRAREA_CREATED = 85,
   EV_SRAREA_TESTED_SUPPORT = 86,
   EV_SRAREA_TESTED_RESISTANCE = 87,
   EV_SRAREA_CHARACTER_FLIP = 88,
   EV_SRAREA_QUALITY_UPGRADE = 89,
   EV_SRAREA_QUALITY_DOWNGRADE = 90,
   EV_HTF_REVERSAL_DETECTED = 91  
};

class CTradeSignal;

// CEvent Class Definition
class CEvent : public CObject {
public:
    ulong id;
    string m_symbol;
    ENUM_EVENT_TYPE type;
    
    CEvent(string symbol, ENUM_EVENT_TYPE eventType);
    
    ENUM_EVENT_TYPE getEventType() const;
    string getSymbol();
    
    virtual ENUM_MARKET_DIRECTION GetMarketDirection() const;
    
    string toString();
    string GetEventName() const;
    virtual bool IsSignalEvent();
    virtual void FillTradeSignal(CTradeSignal& signal) const {}
    virtual int GetOriginTimeframe() const;
    virtual int GetTargetTimeframe() const;
    virtual string GetDetails();
};

// CEvent Class Implementation
CEvent::CEvent(string symbol, ENUM_EVENT_TYPE eventType) : 
    m_symbol(symbol), id(0), type(eventType) {}

ENUM_EVENT_TYPE CEvent::getEventType() const { return type; }

string CEvent::getSymbol()
{
  return m_symbol;
}

ENUM_MARKET_DIRECTION CEvent::GetMarketDirection() const { return MARKET_DIRECTION_NEUTRAL; }

string CEvent::toString() {
  string description = m_symbol+".Event "+IntegerToString(id)+": ";
  
  switch (type) {
     case(EV_NEW_CANDLE): description += "New Candle Created"; break;
     case(EV_HIGH_CREATED): description += "High Created"; break;
     case(EV_LOW_CREATED): description += "Low Created"; break;
     case(EV_HIGH_SWEPT): description += "High Swept"; break;
     case(EV_LOW_SWEPT): description += "Low Swept"; break;
     case(EV_HIGH_BROKEN): description += "High Broken"; break;
     case(EV_LOW_BROKEN): description += "Low Broken"; break;  
     case(EV_ACTIVATE_TRADING): description += "Trading Activated"; break;       
     case(EV_DEACTIVATE_TRADING): description += "Trading Deactivated"; break;   
     case(EV_IMBALANCE_CREATED): description += "Imbalance Created"; break;   
     case(EV_IMBALANCE_ENTERED): description += "Imbalance Entered"; break;   
     case(EV_IMBALANCE_DEACTIVATED): description += "Imbalance Deactivated"; break;   
     case(EV_IMBALANCE_LEFT): description += "Imbalance Left"; break;   
     case(EV_IMBALANCE_INVERTED): description += "Imbalance Inverted"; break;   
     case(EV_IMBALANCE_MITIGATED): description += "Imbalance Mitigated"; break;   
     case(EV_IMBALANCE_MOVEMENT): description += "Imbalance Movement"; break;   
     case(EV_MARKET_CIPHER_DIVERGENCE): description += "Market Cipher Divergence"; break;   
     case(EV_MARKET_CIPHER_NEW_MOMENTUM_WAVE): description += "New Market Cipher Momentum Wave"; break;   
     case(EV_MARKET_CIPHER_MOMENTUM_SHIFT): description += "Market Cipher Momentum Shift"; break;   
     case(EV_HEIKINASHI_NEW_CANDLE): description += "New Heikin Ashi Candle"; break;   
     case(EV_HEIKINASHI_TREND_CHANGE): description += "Heikin Ashi Trend Change"; break;   
     case(EV_HIGH_LEVEL_SWEPT): description += "Price Level High Broken"; break; 
     case(EV_LOW_LEVEL_SWEPT): description += "Price Level Low Swept"; break; 
     case(EV_HIGH_LEVEL_BROKEN): description += "Price Level High Swept"; break; 
     case(EV_LOW_LEVEL_BROKEN): description += "Price Level Low Broken"; break; 
     case(EV_PRICE_LEVEL_CREATED): description += "Price Level Low Broken"; break;          
     case(EV_UT_BOT_BUY_SIGNAL): description += "UT Bot Buy Signal"; break; 
     case(EV_UT_BOT_SELL_SIGNAL): description += "UT Bot Sell Signal"; break;          
     case(EV_SESSION_STARTED): description += "New Session started"; break;          
     case(EV_SESSION_ENDED): description += "Session ended"; break;          
     case(EV_BB_BUY_SIGNAL): description += "Bollinger Band Buy Signal"; break; 
     case(EV_BB_SELL_SIGNAL): description += "Bollinger Band Sell Signal"; break;          
     case(EV_BB_CLOSE_BUY_SIGNAL): description += "Bollinger Band Close Buy Signal"; break; 
     case(EV_BB_CLOSE_SELL_SIGNAL): description += "Bollinger Band Close Sell Signal"; break;          
     case(EV_INVERTED_IMBALANCE_ENTERED): description += "Inverted Imbalance Entered"; break;   
     case(EV_INVERTED_IMBALANCE_LEFT): description += "Inverted Imbalance Left"; break;   
     case(EV_INVERTED_IMBALANCE_MITIGATED): description += "Inverted Imbalance Mitigated"; break;   
     case(EV_INVERTED_IMBALANCE_MOVEMENT): description += "Inverted Imbalance Movement"; break;  
     case(EV_BULLISH_DIVERGENCE_DETECTED):  description += "Bullish Divergence Detected"; break;  
     case(EV_BEARISH_DIVERGENCE_DETECTED):  description += "Bearish Divergence Detected"; break;  
     case(EV_HIGH_LEVEL_MITIGATED): description += "Price Level High Mitigated"; break; 
     case(EV_LOW_LEVEL_MITIGATED): description += "Price Level Low Mitigated"; break; 
     case(EV_HIGH_MITIGATED): description += "High Mitigated"; break; 
     case(EV_LOW_MITIGATED): description += "Low Mitigated"; break; 
     case(EV_TRADE_STOPLOSS_HIT): description += "Stop Loss Hit"; break; 
     case(EV_TRADE_TAKEPROFIT_HIT): description += "Take Profit Hit"; break; 
     case(EV_BULLISH_DIVERGENCE_RESOLVED): description += "Bullish Divergence Resolved"; break;  
     case(EV_BEARISH_DIVERGENCE_RESOLVED): description += "Bearish Divergence Resolved"; break;  
     case(EV_TREND_CHANGE_BULLISH): description += "Bullish Trend Change"; break;  
     case(EV_TREND_BULLISH_ENTRY_SIGNAL): description += "Bullish Trend Entry Signal"; break;  
     case(EV_TREND_CHANGE_BEARISH): description += "Bearish Trend Change"; break;  
     case(EV_TREND_BEARISH_ENTRY_SIGNAL): description += "Bearish Trend Entry Signal"; break;
     case(EV_TRADE_BREAKEVEN_HIT): description += "Trade Breakeven Hit"; break;
     case(EV_TRADE_SETUP_INVALIDATED): description += "Trade Setup Invalidated"; break;
     case(EV_TRADE_PARTIAL_CLOSE): description += "Trade Partial Close"; break;
     case(EV_IMBALANCE_DISRESPECTED): description += "Imbalance disrespected"; break;   
     case(EV_IMBALANCE_INVERSION_CONFIRMED): description += "Imbalance Inversion Confirmed"; break;
     case(EV_MARKET_REVERSAL): description += "Market Reversal"; break;   
     case(EV_UNMITIGATED_IMBALANCE_ENTERED): description += "Unmitigated Imbalance Entered"; break;   
     case(EV_UNMITIGATED_INVERTED_IMBALANCE_ENTERED): description += "Unmitigated Inverted Imbalance Entered"; break;   
     case(EV_MARKET_STRUCTURE_BOS): description += "Market Structure Break of Structure"; break;   
     case(EV_MARKET_STRUCTURE_CHOCH): description += "Market Structure Change of Character"; break;   
     case(EV_PRICE_ACTION_REVERSAL): description += "Price Action Reversal"; break;
     case(EV_PRICE_ACTION_POTENTIAL_REVERSAL): description += "Potential Price Action Reversal"; break;
     case(EV_SRAREA_CREATED): description += "Support/Resistance Area Created"; break;
     case(EV_SRAREA_TESTED_SUPPORT): description += "SR Area Tested as Support"; break;
     case(EV_SRAREA_TESTED_RESISTANCE): description += "SR Area Tested as Resistance"; break;
     case(EV_SRAREA_CHARACTER_FLIP): description += "SR Area Character Flip"; break;
     case(EV_SRAREA_QUALITY_UPGRADE): description += "SR Area Quality Upgrade"; break;
     case(EV_SRAREA_QUALITY_DOWNGRADE): description += "SR Area Quality Downgrade"; break;
     case(EV_HTF_REVERSAL_DETECTED): description += "HTF Reversal Detected"; break;
  }
  
  description += " OTF="+CChartHelper::GetTimeframeName(GetOriginTimeframe());
  if (GetTargetTimeframe() != 0)
     description += ", TTF="+CChartHelper::GetTimeframeName(GetTargetTimeframe());
  if (GetMarketDirection() != MARKET_DIRECTION_NEUTRAL)
  {
     description += ", DIRECTION=";
     switch (GetMarketDirection()) {      
        case(MARKET_DIRECTION_BULLISH): description += "BULLISH"; break;
        case(MARKET_DIRECTION_BEARISH): description += "BEARISH"; break;
     }
  }
  return description;
}

string CEvent::GetEventName() const {
  switch (type) {
     case(EV_NEW_CANDLE): return "EV_NEW_CANDLE";
     case(EV_HIGH_BROKEN): return "EV_HIGH_BROKEN";
     case(EV_LOW_BROKEN): return "EV_LOW_BROKEN";
     case(EV_HIGH_CREATED): return "EV_HIGH_CREATED";
     case(EV_LOW_CREATED): return "EV_LOW_CREATED";
     case(EV_HIGH_SWEPT): return "EV_HIGH_SWEPT";
     case(EV_LOW_SWEPT): return "EV_LOW_SWEPT";
     case(EV_IMBALANCE_CREATED): return "EV_IMBALANCE_CREATED";
     case(EV_IMBALANCE_ENTERED): return "EV_IMBALANCE_ENTERED";
     case(EV_IMBALANCE_DEACTIVATED): return "EV_IMBALANCE_DEACTIVATED";
     case(EV_IMBALANCE_LEFT): return "EV_IMBALANCE_LEFT";
     case(EV_IMBALANCE_INVERTED): return "EV_IMBALANCE_INVERTED";
     case(EV_IMBALANCE_MITIGATED): return "EV_IMBALANCE_MITIGATED";
     case(EV_IMBALANCE_MOVEMENT): return "EV_IMBALANCE_MOVEMENT";
     case(EV_MARKET_CIPHER_DIVERGENCE): return "EV_MARKET_CIPHER_DIVERGENCE";
     case(EV_MARKET_CIPHER_NEW_MOMENTUM_WAVE): return "EV_MARKET_CIPHER_NEW_MOMENTUM_WAVE";
     case(EV_MARKET_CIPHER_MOMENTUM_SHIFT): return "EV_MARKET_CIPHER_MOMENTUM_SHIFT";
     case(EV_ACTIVATE_TRADING): return "EV_ACTIVATE_TRADING";
     case(EV_DEACTIVATE_TRADING): return "EV_DEACTIVATE_TRADING";         
     case(EV_HEIKINASHI_NEW_CANDLE): return "EV_HEIKINASHI_NEW_CANDLE";
     case(EV_HEIKINASHI_TREND_CHANGE): return "EV_HEIKINASHI_TREND_CHANGE"; 
     case(EV_HIGH_LEVEL_SWEPT): return "EV_HIGH_LEVEL_SWEPT"; 
     case(EV_LOW_LEVEL_SWEPT): return "EV_LOW_LEVEL_SWEPT";         
     case(EV_HIGH_LEVEL_BROKEN): return "EV_HIGH_LEVEL_BROKEN"; 
     case(EV_LOW_LEVEL_BROKEN): return "EV_LOW_LEVEL_BROKEN";         
     case(EV_PRICE_LEVEL_CREATED): return "EV_PRICE_LEVEL_CREATED";
     case(EV_UT_BOT_BUY_SIGNAL): return "EV_UT_BOT_BUY_SIGNAL";         
     case(EV_UT_BOT_SELL_SIGNAL): return "EV_UT_BOT_SELL_SIGNAL";              
     case(EV_SESSION_STARTED): return "EV_SESSION_STARTED";              
     case(EV_SESSION_ENDED): return "EV_SESSION_ENDED";              
     case(EV_BB_BUY_SIGNAL): return "EV_BB_BUY_SIGNAL";              
     case(EV_BB_SELL_SIGNAL): return "EV_BB_SELL_SIGNAL";              
     case(EV_BB_CLOSE_BUY_SIGNAL): return "EV_BB_CLOSE_BUY_SIGNAL";              
     case(EV_BB_CLOSE_SELL_SIGNAL): return "EV_BB_CLOSE_SELL_SIGNAL";              
     case(EV_INVERTED_IMBALANCE_ENTERED): return "EV_IMBALANCE_ENTERED";
     case(EV_INVERTED_IMBALANCE_LEFT): return "EV_IMBALANCE_LEFT";
     case(EV_INVERTED_IMBALANCE_MITIGATED): return "EV_IMBALANCE_MITIGATED";
     case(EV_INVERTED_IMBALANCE_MOVEMENT): return "EV_IMBALANCE_MOVEMENT";
     case(EV_BULLISH_DIVERGENCE_DETECTED): return "EV_BULLISH_DIVERGENCE_DETECTED";
     case(EV_BEARISH_DIVERGENCE_DETECTED): return "EV_BEARISH_DIVERGENCE_DETECTED";
     case(EV_HIGH_LEVEL_MITIGATED): return "EV_HIGH_LEVEL_MITIGATED";
     case(EV_LOW_LEVEL_MITIGATED): return "EV_LOW_LEVEL_MITIGATED";
     case(EV_HIGH_MITIGATED): return "EV_HIGH_MITIGATED";
     case(EV_LOW_MITIGATED): return "EV_LOW_MITIGATED";
     case(EV_TRADE_STOPLOSS_HIT): return "EV_TRADE_STOPLOSS_HIT";
     case(EV_TRADE_TAKEPROFIT_HIT): return "EV_TRADE_TAKEPROFIT_HIT";
     case(EV_BULLISH_DIVERGENCE_RESOLVED): return "EV_BULLISH_DIVERGENCE_RESOLVED";
     case(EV_BEARISH_DIVERGENCE_RESOLVED): return "EV_BEARISH_DIVERGENCE_RESOLVED";
     case(EV_TREND_CHANGE_BULLISH): return "EV_TREND_CHANGE_BULLISH";
     case(EV_TREND_BULLISH_ENTRY_SIGNAL): return "EV_TREND_BULLISH_ENTRY_SIGNAL";
     case(EV_TREND_CHANGE_BEARISH): return "EV_TREND_CHANGE_BEARISH";
     case(EV_TREND_BEARISH_ENTRY_SIGNAL): return "EV_TREND_BEARISH_ENTRY_SIGNAL";
     case(EV_TRADE_BREAKEVEN_HIT): return "EV_TRADE_BREAKEVEN_HIT";
     case(EV_TRADE_SETUP_INVALIDATED): return "EV_TRADE_SETUP_INVALIDATED";
     case(EV_TRADE_PARTIAL_CLOSE): return "EV_TRADE_PARTIAL_CLOSE";
     case(EV_IMBALANCE_DISRESPECTED): return "EV_IMBALANCE_DISRESPECTED";
     case(EV_MARKET_REVERSAL): return "EV_MARKET_REVERSAL";
     case(EV_UNMITIGATED_IMBALANCE_ENTERED): return "EV_UNMITIGATED_IMBALANCE_ENTERED";
     case(EV_UNMITIGATED_INVERTED_IMBALANCE_ENTERED): return "EV_UNMITIGATED_INVERTED_IMBALANCE_ENTERED";
     case(EV_MARKET_STRUCTURE_BOS): return "EV_MARKET_STRUCTURE_BOS";
     case(EV_MARKET_STRUCTURE_CHOCH): return "EV_MARKET_STRUCTURE_CHOCH";
     case(EV_PRICE_ACTION_REVERSAL): return "EV_PRICE_ACTION_REVERSAL";
     case(EV_PRICE_ACTION_POTENTIAL_REVERSAL): return "EV_PRICE_ACTION_POTENTIAL_REVERSAL";
     case(EV_SRAREA_CREATED): return "EV_SRAREA_CREATED";
     case(EV_SRAREA_TESTED_SUPPORT): return "EV_SRAREA_TESTED_SUPPORT";
     case(EV_SRAREA_TESTED_RESISTANCE): return "EV_SRAREA_TESTED_RESISTANCE";
     case(EV_SRAREA_CHARACTER_FLIP): return "EV_SRAREA_CHARACTER_FLIP";
     case(EV_SRAREA_QUALITY_UPGRADE): return "EV_SRAREA_QUALITY_UPGRADE";
     case(EV_SRAREA_QUALITY_DOWNGRADE): return "EV_SRAREA_QUALITY_DOWNGRADE";
     case(EV_HTF_REVERSAL_DETECTED): return "EV_HTF_REVERSAL_DETECTED";
  }

  return "UNKNOWN";
}

int CEvent::GetOriginTimeframe() const {
    return 0; 
}

int CEvent::GetTargetTimeframe() const {
    return 0;
}

string CEvent::GetDetails() {
    return "CEvent has no details";
}

bool CEvent::IsSignalEvent()
{
    return false;
}


#endif

