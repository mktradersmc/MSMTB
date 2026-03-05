//+------------------------------------------------------------------+
//|                                                    TradeInfo.mqh |
//|                                   Copyright 2022, Michael M�ller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2022, Michael M�ller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef TRADEINFO_MQH
#define TRADEINFO_MQH

#include <Object.mqh>
#include <Arrays\ArrayObj.mqh>
#include <Expert\Event.mqh>
#include <Expert\TradeHistoryEvent.mqh>
#include <Expert\EventStore.mqh>
// TradeEvent.mqh will be included elsewhere to avoid circular dependency

// Position Details f�r besseres Deal-Tracking
class CPositionDetails : public CObject
{
public:
    ulong positionId;
    ulong entryTicket;
    double entryPrice;
    datetime entryTime;
    double volume;           // Original Volumen
    double remainingVolume;  // Verbleibendes Volumen nach Teil-Closes
    bool isClosed;
    double profit;
    double commission;
    double swap;
    
    CPositionDetails(ulong posId, ulong ticket, double price, datetime time, double vol)
        : positionId(posId),
          entryTicket(ticket),
          entryPrice(price),
          entryTime(time),
          volume(vol),
          remainingVolume(vol),
          isClosed(false),
          profit(0.0),
          commission(0.0),
          swap(0.0)
    {}
};

class CTradeInfo : public CObject
{
public:
    CArrayObj* m_positions;  // Array von CPositionDetails Objekten
    CArrayObj* m_history;    // Array von CTradeHistoryEvent Objekten
    string m_symbol;         // Symbol for this trade
    
    ENUM_EVENT_TYPE closeEventType;
    ENUM_EVENT_TYPE lastGeneratedEventType;
    double riskRewardTarget;
    
    bool isOpen;
    bool invalid;
    datetime orderOpenTime;
    datetime orderCloseTime;
    datetime lastTimeInStoploss;
    int ticket;             // Wird f�r Kompatibilit�t behalten
    double entryPrice;      // Durchschnittlicher Eintrittspreis
    double stopLoss;
    double closePrice;
    double takeProfitPrice;
    double profit;          // Gesamtprofit �ber alle Positionen
    double commissions;     // Gesamtkommissionen
    double lots;            // Gesamtvolumen bei Er�ffnung
    double remaining_lots;  // Verbleibendes Gesamtvolumen
    double pips_profit;
    double pips_stop;
    double risk_reward;
    double risk_reward_max;
    bool stopLossAtBreakeven;
    int direction;          // 1 = Long, -1 = Short
    string strategyName;
    string tradeId;        // Nur noch f�r Logging
    ulong lastCheckedDeal; 
    
    CTradeInfo();
    ~CTradeInfo();
    
    bool IsWinner();
    bool IsLong();
    bool IsShort();
    bool IsStopLossAtBE();
    bool IsInvalidated();
    
    // Position Management
    void AddPosition(ulong posId, ulong ticket, double price, datetime time, double volume);
    void UpdatePosition(ulong posId, double closedVolume, double closeProfits, 
                       double closeCommission, double closeSwap);
    bool HasPosition(ulong posId);
    CPositionDetails* GetPosition(ulong posId);
    void RecalculateTradeStats();
    
    // History Event Methods
    void AddHistoryEvent(ENUM_TRADE_HISTORY_EVENT type, double price, double volume, 
                        ulong ticket, double profit = 0.0, string comment = "");
    
    void OnStopLossModifiedBreakeven(double newStopLoss, ulong ticket);
    void OnStopLossModifiedTrailing(double newStopLoss, ulong ticket);
    void OnStopLossModified(double newStopLoss, ulong ticket, string reason = "");
    void OnStopLossHit(double closePrice, ulong ticket, double profit);
    void OnTakeProfitHit(double closePrice, ulong ticket, double profit);
    void OnClosedByExpert(double closePrice, ulong ticket, double profit, string reason = "");
    void OnPartialClose(double closedVolume, double closePrice, ulong ticket, double profit);
    void OnTradeOpened(double openPrice, ulong ticket);
    
    string toString();
    string GetTradeHistory();
    int GetHistoryEventCount();
    CTradeHistoryEvent* GetHistoryEvent(int index);
    ENUM_TRADE_HISTORY_EVENT GetLastEventType();
};

CTradeInfo::CTradeInfo() : 
    strategyName(""), 
    riskRewardTarget(0),
    lastGeneratedEventType(EV_EMPTY),
    lastCheckedDeal(0)
{
    m_positions = new CArrayObj();
    m_history = new CArrayObj();
    m_symbol = _Symbol;  // Initialize with current symbol
    
    ticket = 0;
    entryPrice = 0;
    stopLoss = 0;
    takeProfitPrice = 0;
    profit = 0;
    stopLossAtBreakeven = false;
    closeEventType = EV_EMPTY;
    tradeId = "";
    lots = 0;
    remaining_lots = 0;
    risk_reward = 0;
    risk_reward_max = 0;
}

CTradeInfo::~CTradeInfo()
{
    if(m_positions != NULL)
    {
        delete m_positions;
        m_positions = NULL;
    }
    if(m_history != NULL)
    {
        delete m_history;
        m_history = NULL;
    }
}

void CTradeInfo::AddPosition(ulong posId, ulong ticket, double price, datetime time, double volume)
{
    CPositionDetails* pos = new CPositionDetails(posId, ticket, price, time, volume);
    m_positions.Add(pos);
    
    // Gesamtvolumen aktualisieren
    lots += volume;
    remaining_lots += volume;
    
    // Durchschnittlichen Eintrittspreis berechnen
    double totalValue = 0;
    for(int i = 0; i < m_positions.Total(); i++)
    {
        CPositionDetails* p = m_positions.At(i);
        totalValue += p.entryPrice * p.volume;
    }
    
    if(orderOpenTime == 0)
        orderOpenTime = time;
        
    isOpen = true;
}

void CTradeInfo::UpdatePosition(ulong posId, double closedVolume, double closeProfits, 
                              double closeCommission, double closeSwap)
{
    CPositionDetails* pos = GetPosition(posId);
    if(pos != NULL)
    {
        pos.remainingVolume -= closedVolume;
        pos.profit += closeProfits;
        pos.commission += closeCommission;
        pos.swap += closeSwap;
        
        if(pos.remainingVolume <= 0)
        {
            pos.isClosed = true;
            pos.remainingVolume = 0;
        }
        
        RecalculateTradeStats();
    }
}

void CTradeInfo::RecalculateTradeStats()
{
    remaining_lots = 0;
    profit = 0;
    commissions = 0;
    bool anyOpen = false;
    
    for(int i = 0; i < m_positions.Total(); i++)
    {
        CPositionDetails* pos = m_positions.At(i);
        remaining_lots += pos.remainingVolume;
        profit += pos.profit;
        commissions += pos.commission;
        if(!pos.isClosed)
            anyOpen = true;
    }
    
    isOpen = anyOpen;
    
    if(!isOpen && orderCloseTime == 0)
        orderCloseTime = TimeCurrent();
}

bool CTradeInfo::HasPosition(ulong posId)
{
    return GetPosition(posId) != NULL;
}

CPositionDetails* CTradeInfo::GetPosition(ulong posId)
{
    for(int i = 0; i < m_positions.Total(); i++)
    {
        CPositionDetails* pos = m_positions.At(i);
        if(pos.positionId == posId)
            return pos;
    }
    return NULL;
}

string CTradeInfo::toString()
{
    string posInfo = "";
    for(int i = 0; i < m_positions.Total(); i++)
    {
        CPositionDetails* pos = m_positions.At(i);
        posInfo += StringFormat(" Pos%d[ID=%llu Vol=%.2f/%.2f]", i, pos.positionId, 
                               pos.remainingVolume, pos.volume);
    }
    
    return StringFormat("TradeId=%s, IsOpen=%s, Invalid=%s, TotalVol=%.2f/%.2f,%s", 
                       tradeId, (string)isOpen, (string)invalid, remaining_lots, lots, posInfo);
}

bool CTradeInfo::IsLong()
{
    return direction == 1;
}

bool CTradeInfo::IsShort()
{
    return direction == -1;
}

bool CTradeInfo::IsInvalidated()
{
    return invalid;
}

bool CTradeInfo::IsWinner()
{
    return profit > 0;
}

bool CTradeInfo::IsStopLossAtBE()
{
    return stopLossAtBreakeven;
}

void CTradeInfo::AddHistoryEvent(ENUM_TRADE_HISTORY_EVENT type, double price, 
                                double volume, ulong ticket, double profit = 0.0, 
                                string comment = "")
{
    CTradeHistoryEvent* event = new CTradeHistoryEvent(TimeCurrent(), type, price, 
                                                      volume, ticket, profit, comment);
    m_history.Add(event);
}

// Die restlichen Event-Handler bleiben gleich wie in der urspr�nglichen Version
void CTradeInfo::OnStopLossModifiedBreakeven(double newStopLoss, ulong ticket)
{
    stopLoss = newStopLoss;
    stopLossAtBreakeven = true;
    AddHistoryEvent(THE_STOPLOSS_MODIFIED_BREAKEVEN, newStopLoss, remaining_lots, ticket, 0.0, 
                   "Stop Loss moved to break-even at " + DoubleToString(newStopLoss, _Digits));
}

void CTradeInfo::OnStopLossModifiedTrailing(double newStopLoss, ulong ticket)
{
    stopLoss = newStopLoss;
    stopLossAtBreakeven = true;
    AddHistoryEvent(THE_STOPLOSS_MODIFIED_TRAILING, newStopLoss, remaining_lots, ticket, 0.0, 
                   "Trailing Stop adjusted to " + DoubleToString(newStopLoss, _Digits));
}

void CTradeInfo::OnStopLossModified(double newStopLoss, ulong ticket, string reason = "")
{
    stopLoss = newStopLoss;
    stopLossAtBreakeven = true;
    AddHistoryEvent(THE_STOPLOSS_MODIFIED, newStopLoss, remaining_lots, ticket, 0.0, 
                   StringFormat("Stop Loss modified to %s%s", 
                              DoubleToString(newStopLoss, _Digits),
                              reason != "" ? " (" + reason + ")" : ""));
}

void CTradeInfo::OnStopLossHit(double closePrice, ulong ticket, double profit)
{
    AddHistoryEvent(THE_STOPLOSS_HIT, closePrice, remaining_lots, ticket, profit);
    this.profit += profit;
    this.isOpen = false;
    this.closePrice = closePrice;
    
    // Trade Event will be generated by TradeManager to avoid circular dependency
}

void CTradeInfo::OnTakeProfitHit(double closePrice, ulong ticket, double profit)
{
    AddHistoryEvent(THE_TAKEPROFIT_HIT, closePrice, remaining_lots, ticket, profit);
    this.profit += profit;
    this.isOpen = false;
    this.closePrice = closePrice;
    
    // Trade Event will be generated by TradeManager to avoid circular dependency
}

void CTradeInfo::OnClosedByExpert(double closePrice, ulong ticket, double profit, string reason = "")
{
    AddHistoryEvent(THE_CLOSED_BY_EXPERT, closePrice, remaining_lots, ticket, profit, reason);
    this.profit += profit;
    this.isOpen = false;
    this.closePrice = closePrice;
    
    // Trade Event will be generated by TradeManager to avoid circular dependency
}

void CTradeInfo::OnPartialClose(double closedVolume, double closePrice, ulong ticket, double profit)
{
    AddHistoryEvent(THE_PARTIAL_CLOSE, closePrice, closedVolume, ticket, profit);
    this.profit += profit;
    this.closePrice = closePrice;
    
    // Trade Event will be generated by TradeManager to avoid circular dependency
}

void CTradeInfo::OnTradeOpened(double openPrice, ulong ticket)
{
    AddHistoryEvent(THE_TRADE_OPENED, openPrice, lots, ticket);
    this.isOpen = true;
}

string CTradeInfo::GetTradeHistory()
{
    string history = StringFormat("Trade History for %s (ID: %s)\n", 
                                strategyName, tradeId);
                                
    for(int i = 0; i < m_history.Total(); i++)
    {
        CTradeHistoryEvent* event = m_history.At(i);
        history += event.ToString() + "\n";
    }
    
    return history;
}

int CTradeInfo::GetHistoryEventCount()
{
    return m_history.Total();
}

CTradeHistoryEvent* CTradeInfo::GetHistoryEvent(int index)
{
    if(index >= 0 && index < m_history.Total())
        return m_history.At(index);
    return NULL;
}

ENUM_TRADE_HISTORY_EVENT CTradeInfo::GetLastEventType()
{
    if(m_history.Total() > 0)
    {
        CTradeHistoryEvent* event = m_history.At(m_history.Total() - 1);
        return event.GetType();
    }
    return THE_TRADE_OPENED;
}

#endif

