//+------------------------------------------------------------------+
//|                                                   TradeEvent.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef TRADE_EVENT_MQH
#define TRADE_EVENT_MQH

#include <Expert\Event.mqh>

// Forward declaration
class CTradeInfo;

class CTradeEvent : public CEvent
{
private:
    CTradeInfo* m_trade;
    double m_price;
    datetime m_time;
    string m_invalidationReason;  // Neues Feld für Invalidierungsgrund
    // Cache commonly used trade info to avoid accessing CTradeInfo members
    bool m_isLong;
    string m_strategyName;
    int m_ticket;
    datetime m_orderOpenTime;
    double m_pipsProfit;

public:
    CTradeEvent(string symbol, ENUM_EVENT_TYPE eventType, CTradeInfo* trade, double price, 
                bool isLong, string strategyName, int ticket, datetime orderOpenTime, double pipsProfit, 
                string invalidationReason = "")
        : CEvent(symbol, eventType)
    {
        m_trade = trade;
        m_price = price;
        m_time = TimeCurrent();
        m_invalidationReason = invalidationReason;
        m_isLong = isLong;
        m_strategyName = strategyName;
        m_ticket = ticket;
        m_orderOpenTime = orderOpenTime;
        m_pipsProfit = pipsProfit;
    }
    
    ~CTradeEvent() 
    {
        // Trade Info nicht löschen, da es vom TradeManager verwaltet wird
    }
    
    CTradeInfo* GetTrade() const { return m_trade; }
    double GetPrice() const { return m_price; }
    datetime GetTime() const { return m_time; }
    string GetInvalidationReason() const { return m_invalidationReason; }

    virtual string GetDetails() override
    {
        string eventDesc = m_symbol+": ";
        switch(type)
        {
            case EV_TRADE_STOPLOSS_HIT:
                eventDesc = "Stop Loss hit";
                break;
            case EV_TRADE_TAKEPROFIT_HIT:
                eventDesc = "Take Profit hit";
                break;
            case EV_TRADE_PARTIAL_CLOSE:
                eventDesc = "Trade partially closed";
                break;
            case EV_TRADE_SETUP_INVALIDATED:
                eventDesc = "Setup invalidated";
                if(m_invalidationReason != "")
                    eventDesc += ". Reason: " + m_invalidationReason;
                break;
        }
        
        string direction = m_isLong ? "Long" : "Short";
        
        if(type == EV_TRADE_SETUP_INVALIDATED)
        {
            return StringFormat("%s %s trade for strategy %s", 
                eventDesc,
                direction,
                m_strategyName);
        }
        else
        {
            return StringFormat("%s %s trade #%d from %s at price %f. P/L: %f pips", 
                eventDesc,
                direction,
                m_ticket,
                TimeToString(m_orderOpenTime),
                m_price,
                m_pipsProfit);
        }
    }

    virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override
    {
        return m_isLong ? MARKET_DIRECTION_BULLISH : MARKET_DIRECTION_BEARISH;
    }
    
    virtual int GetOriginTimeframe() const override
    {        
        return 0;
    }
};

#endif

