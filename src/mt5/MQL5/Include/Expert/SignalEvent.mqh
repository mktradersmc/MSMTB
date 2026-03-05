
#include <Expert\Event.mqh>
#include <Expert\TradeSignal.mqh>

class CSignalEvent : public CEvent
{
protected:
    double m_entryPrice;
    double m_stopLoss;
    double m_takeProfit;
    ENUM_EVENT_TYPE m_closeEventType;

public:
    CSignalEvent(string symbol, ENUM_EVENT_TYPE eventType, double entryPrice, double stopLoss, double takeProfit, ENUM_EVENT_TYPE closeEventType)
        : CEvent(symbol, eventType), m_entryPrice(entryPrice), m_stopLoss(stopLoss), m_takeProfit(takeProfit), m_closeEventType(closeEventType) {}

    virtual bool IsSignalEvent() override { return true; }
    
    virtual void FillTradeSignal(CTradeSignal& signal) const
    {
        Print("Extract trade data from signal");
        Print("Enty = "+NormalizeDouble(m_entryPrice,5));
        Print("StopLoss = "+NormalizeDouble(m_stopLoss,5));
        Print("TP = "+NormalizeDouble(m_takeProfit,5));
        Print("Cllose Event = "+EnumToString(m_closeEventType));
        signal.Set(m_entryPrice, m_stopLoss, m_takeProfit, m_closeEventType);
    }
};

