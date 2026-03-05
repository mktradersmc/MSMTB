//+------------------------------------------------------------------+
//|                                             UTBotSignalEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef BB_SIGNAL_EVENT_MQH
#define BB_SIGNAL_EVENT_MQH

#include <Expert\SignalEvent.mqh>
#include <Expert\Candle.mqh>

class CBBSignalEvent : public CSignalEvent
{
private:
   CCandle *m_signalCandle;
   
public:
   CBBSignalEvent(string symbol, ENUM_EVENT_TYPE eventType, CCandle* candle, double entryPrice, double stopLoss, double takeProfit, ENUM_EVENT_TYPE closeEventType) : CSignalEvent(symbol, eventType, entryPrice, stopLoss, takeProfit, closeEventType) {
      m_signalCandle = candle;
   }
   ~CBBSignalEvent() {};
   
   CCandle* getSignalCandle() {
      return m_signalCandle;
   }
   
   // Neue virtuelle Funktion für Origin Timeframe
   virtual int GetOriginTimeframe() const {
      return m_signalCandle.timeframe; 
   }
   
   virtual string GetDetails() {
       string result;
       result = getSymbol()+"."+CChartHelper::GetTimeframeName(getSignalCandle().timeframe)+": New BB "+(GetMarketDirection()==MARKET_DIRECTION_BULLISH?"Buy":"Sell")+" Signal on candle at "+CHelper::TimeToString(getSignalCandle().openTime)+" with stop loss at "+NormalizeDouble(m_stopLoss,5);
       return result;
   }
   
   virtual ENUM_MARKET_DIRECTION GetMarketDirection() const { 
      return getEventType()==EV_BB_BUY_SIGNAL?MARKET_DIRECTION_BULLISH:MARKET_DIRECTION_BEARISH;
   }
};

#endif


