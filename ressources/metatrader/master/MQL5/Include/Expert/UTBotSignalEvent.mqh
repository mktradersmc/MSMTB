//+------------------------------------------------------------------+
//|                                             UTBotSignalEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef UT_BOT_SIGNAL_EVENT_MQH
#define UT_BOT_SIGNAL_EVEN_MQH

#include <Expert\Event.mqh>
#include <Expert\Candle.mqh>

class CUTBotSignalEvent : public CEvent
{
private:
   CCandle *m_signalCandle;
   
public:
   CUTBotSignalEvent(string symbol, ENUM_EVENT_TYPE eventType, CCandle* candle) : CEvent(symbol, eventType) {
      m_signalCandle = candle;
   }
   ~CUTBotSignalEvent() {};
   
   CCandle* getSignalCandle() {
      return m_signalCandle;
   }
   
   // Neue virtuelle Funktion für Origin Timeframe
   virtual int GetOriginTimeframe() const {
      return m_signalCandle.timeframe; 
   }
   
   virtual string GetDetails() {
       string result;
       result = getSymbol()+"."+CChartHelper::GetTimeframeName(getSignalCandle().timeframe)+": New UT Bot "+(GetMarketDirection()==MARKET_DIRECTION_BULLISH?"Buy":"Sell")+" Signal on candle at "+CHelper::TimeToString(getSignalCandle().openTime);
       return result;
   }
   
   virtual ENUM_MARKET_DIRECTION GetMarketDirection() const { 
      return getEventType()==EV_UT_BOT_BUY_SIGNAL?MARKET_DIRECTION_BULLISH:MARKET_DIRECTION_BEARISH;
   }
};

#endif


