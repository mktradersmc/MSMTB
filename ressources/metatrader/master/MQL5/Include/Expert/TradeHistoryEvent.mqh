//+------------------------------------------------------------------+
//|                                            TradeHistoryEvent.mqh |
//|                                   Copyright 2022, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2022, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef TRADEHISTORYEVENT_MQH
#define TRADEHISTORYEVENT_MQH

#include <Object.mqh>

enum ENUM_TRADE_HISTORY_EVENT
{
    THE_TRADE_OPENED,                    // Trade wurde eröffnet
    THE_STOPLOSS_MODIFIED_BREAKEVEN,     // Stop Loss wurde auf Break-Even gesetzt
    THE_STOPLOSS_MODIFIED_TRAILING,      // Stop Loss wurde im Trailing angepasst
    THE_STOPLOSS_MODIFIED,               // Sonstige Stop Loss Anpassungen
    THE_TAKEPROFIT_MODIFIED,             // Take Profit wurde angepasst
    THE_PARTIAL_CLOSE,                   // Teil des Trades wurde geschlossen
    THE_STOPLOSS_HIT,                    // Stop Loss wurde getroffen
    THE_TAKEPROFIT_HIT,                  // Take Profit wurde getroffen
    THE_CLOSED_BY_EXPERT,                // Manuell durch Expert geschlossen
    THE_TRADE_EXPIRED                    // Trade wurde wegen Zeitablauf geschlossen
};

class CTradeHistoryEvent : public CObject
{
private:
   datetime m_time;                      // Zeitpunkt des Events
   ENUM_TRADE_HISTORY_EVENT m_type;      // Art des Events
   double m_price;                       // Relevanter Preis
   double m_volume;                      // Betroffenes Volumen
   ulong m_ticket;                       // Betroffenes Ticket
   double m_profit;                      // Profit (falls relevant)
   string m_comment;                     // Zusätzliche Infos

public:
   CTradeHistoryEvent();
   CTradeHistoryEvent(datetime time, ENUM_TRADE_HISTORY_EVENT type, double price, 
                     double volume, ulong ticket, double profit = 0.0, string comment = "");
   ~CTradeHistoryEvent();
   
   // Getter Methoden
   datetime GetTime() const;
   ENUM_TRADE_HISTORY_EVENT GetType() const;
   double GetPrice() const;
   double GetVolume() const;
   ulong GetTicket() const;
   double GetProfit() const;
   string GetComment() const;
   
   string ToString() const;
};

CTradeHistoryEvent::CTradeHistoryEvent()
{
   m_time = 0;
   m_type = THE_TRADE_OPENED;
   m_price = 0.0;
   m_volume = 0.0;
   m_ticket = 0;
   m_profit = 0.0;
   m_comment = "";
}

CTradeHistoryEvent::CTradeHistoryEvent(datetime time, ENUM_TRADE_HISTORY_EVENT type, 
                                     double price, double volume, ulong ticket,
                                     double profit = 0.0, string comment = "")
{
   m_time = time;
   m_type = type;
   m_price = price;
   m_volume = volume;
   m_ticket = ticket;
   m_profit = profit;
   m_comment = comment;
}

CTradeHistoryEvent::~CTradeHistoryEvent()
{
}

datetime CTradeHistoryEvent::GetTime() const
{
   return m_time;
}

ENUM_TRADE_HISTORY_EVENT CTradeHistoryEvent::GetType() const
{
   return m_type;
}

double CTradeHistoryEvent::GetPrice() const
{
   return m_price;
}

double CTradeHistoryEvent::GetVolume() const
{
   return m_volume;
}

ulong CTradeHistoryEvent::GetTicket() const
{
   return m_ticket;
}

double CTradeHistoryEvent::GetProfit() const
{
   return m_profit;
}

string CTradeHistoryEvent::GetComment() const
{
   return m_comment;
}

string CTradeHistoryEvent::ToString() const
{
   return StringFormat("[%s] %s: Price=%.5f, Volume=%.2f, Ticket=%d, Profit=%.2f %s",
                      TimeToString(m_time),
                      EnumToString(m_type),
                      m_price,
                      m_volume,
                      m_ticket,
                      m_profit,
                      m_comment);
}

#endif
