#ifndef TRADE_SIGNAL_MQH
#define TRADE_SIGNAL_MQH

#include <Object.mqh>
#include <Expert\Event.mqh>

class CTradeSignal : public CObject
{
public:
    double m_entryPrice;
    double m_stopLoss;
    double m_takeProfit;
    bool m_isValid;
    ENUM_EVENT_TYPE m_closeEventType;
public:
    string m_description;

public:
    CTradeSignal() : m_entryPrice(0), m_stopLoss(0), m_takeProfit(0), m_isValid(false), m_closeEventType(ENUM_EVENT_TYPE(-1)) {}
    
    void Set(double entry, double sl, double tp, ENUM_EVENT_TYPE closeEventType) 
    {
        m_entryPrice = entry;
        m_stopLoss = sl;
        m_takeProfit = tp;
        m_closeEventType = closeEventType;
        m_isValid = true;
        m_description = "";
    }
    
    double GetEntryPrice() const { return m_entryPrice; }
    double GetStopLoss() const { return m_stopLoss; }
    double GetTakeProfit() const { return m_takeProfit; }
    bool IsValid() const { return m_isValid; }
    ENUM_EVENT_TYPE GetCloseEventType() const { return m_closeEventType; }
};

#endif

