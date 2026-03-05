#ifndef PRICE_LEVEL_MQH
#define PRICE_LEVEL_MQH

#include <Object.mqh>
#include <Arrays/ArrayInt.mqh>
#include <Expert\ITreeNode.mqh>
#include <Expert\Session.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Globals.mqh>

enum ENUM_LEVEL_TYPE {
    LEVEL_SESSION,
    LEVEL_DAILY,
    LEVEL_WEEKLY,
    LEVEL_MONTHLY,
    LEVEL_H1,
    LEVEL_H4
};

enum ENUM_LEVEL_DIRECTION {
    LEVEL_HIGH,
    LEVEL_LOW
};

// CPriceLevel Class Definition
class CPriceLevel : public ITreeNode
{
private:
    ENUM_LEVEL_TYPE m_type;
    ENUM_LEVEL_DIRECTION m_direction;
    double m_price;
    CSession* m_session;
    CCandle* m_candle;
    datetime m_time;
    CArrayInt* m_timeframes;
    CArrayInt* m_breakStatus;
    CArrayInt* m_eventStatus;
    CArrayInt* m_mitigatedStatus;
    int m_timeframeId;

public:
    CPriceLevel(ENUM_LEVEL_TYPE type, ENUM_LEVEL_DIRECTION direction, double price, datetime creation_time, int timeframeId = 0);
    ~CPriceLevel();

    ENUM_LEVEL_TYPE GetType() const;
    ENUM_LEVEL_DIRECTION GetDirection() const;
    double GetPrice() const;
    datetime GetTime() const;
    void SetSession(CSession* session);
    void SetCandle(CCandle* candle);
    CSession* GetSession() const;
    CCandle* GetCandle() const;
    void AddTimeframe(int timeframe);
    ENUM_BREAK_TYPE SetBreakStatus(int timeframe, ENUM_BREAK_TYPE status);
    ENUM_BREAK_TYPE GetBreakStatus(int timeframe) const;
    bool GetMitigatedStatus(int timeframe) const;
    void SetMitigatedStatus(int timeframe, bool status);
    virtual double GetTreeValue() const override;
    string toString();
    int GetTimeframeId() const;
};

// CPriceLevel Class Implementation
CPriceLevel::CPriceLevel(ENUM_LEVEL_TYPE type, ENUM_LEVEL_DIRECTION direction, double price, datetime creation_time, int timeframeId)
    : m_type(type), m_direction(direction), m_price(price), m_time(creation_time),  m_timeframeId(timeframeId), m_session(NULL), m_candle(NULL)
{
    m_timeframes = new CArrayInt();
    m_breakStatus = new CArrayInt();
    m_eventStatus = new CArrayInt();
    m_mitigatedStatus = new CArrayInt();
}

CPriceLevel::~CPriceLevel()
{
    delete m_timeframes;
    delete m_breakStatus;
    delete m_eventStatus;
    delete m_mitigatedStatus;
}

int CPriceLevel::GetTimeframeId() const { return m_timeframeId; }
ENUM_LEVEL_TYPE CPriceLevel::GetType() const { return m_type; }
ENUM_LEVEL_DIRECTION CPriceLevel::GetDirection() const { return m_direction; }
double CPriceLevel::GetPrice() const { return m_price; }
datetime CPriceLevel::GetTime() const { return m_time; }
void CPriceLevel::SetSession(CSession* session) { m_session = session; }
void CPriceLevel::SetCandle(CCandle* candle) { m_candle = candle; }
CSession* CPriceLevel::GetSession() const { return m_session; }
CCandle* CPriceLevel::GetCandle() const { return m_candle; }

void CPriceLevel::AddTimeframe(int timeframe)
{
    if(m_timeframes.SearchLinear(timeframe) == -1)
    {
        m_timeframes.Add(timeframe);
        m_breakStatus.Add((int)BT_NONE);
        m_eventStatus.Add(0);
        m_mitigatedStatus.Add(0);
    }
}

ENUM_BREAK_TYPE CPriceLevel::SetBreakStatus(int timeframe, ENUM_BREAK_TYPE status)
{
    int index = m_timeframes.SearchLinear(timeframe);
    if(index == -1)
    {
        AddTimeframe(timeframe);
        index = m_timeframes.Total() - 1;
    }
    
    ENUM_BREAK_TYPE currentStatus = (ENUM_BREAK_TYPE)m_breakStatus.At(index);
    if(status > currentStatus)
    {
        m_breakStatus.Update(index, (int)status);
        return status;
    }
    return currentStatus;
}

ENUM_BREAK_TYPE CPriceLevel::GetBreakStatus(int timeframe) const
{
    int index = m_timeframes.SearchLinear(timeframe);
    if(index != -1)
    {
        return (ENUM_BREAK_TYPE)m_breakStatus.At(index);
    }
    return BT_NONE;
}

bool CPriceLevel::GetMitigatedStatus(int timeframe) const
{
    int index = m_timeframes.SearchLinear(timeframe);
    if(index != -1)
    {
        return (bool)m_mitigatedStatus.At(index);
    }
    return false;
}

void CPriceLevel::SetMitigatedStatus(int timeframe, bool status)
{
    int index = m_timeframes.SearchLinear(timeframe);
    if(index == -1)
    {
        AddTimeframe(timeframe);
        index = m_timeframes.Total() - 1;
    }
    m_mitigatedStatus.Update(index, (int)status);
}

double CPriceLevel::GetTreeValue() const
{
    return m_price;
}

string CPriceLevel::toString() 
{
    string result = "Price " + (GetDirection() == LEVEL_HIGH ? "High" : "Low") + " Level at " + 
                    DoubleToString(GetPrice(), _Digits) + " created at " + CHelper::TimeToString(GetTime());
/*    
    for(int i = 0; i < m_timeframes.Total(); i++)
    {
        int tf = m_timeframes.At(i);
        ENUM_BREAK_TYPE breakStatus = (ENUM_BREAK_TYPE)m_breakStatus.At(i);
        bool mitigatedStatus = (bool)m_mitigatedStatus.At(i);
        
        result += "\n  " + CChartHelper::GetTimeframeName(tf) + ": ";
        result += EnumToString(breakStatus);
        if(mitigatedStatus)
            result += " (Mitigated)";
    }
  */  
    return result;
}

#endif // PRICE_LEVEL_MQH


