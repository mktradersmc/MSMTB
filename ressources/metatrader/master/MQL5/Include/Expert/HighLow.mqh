//+------------------------------------------------------------------+
//|                                                      HighLow.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef HIGHLOW_MQH
#define HIGHLOW_MQH

#include <Expert\ChartHelper.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Helper.mqh>
#include <Expert\ITreeNode.mqh>
#include <Arrays\ArrayObj.mqh>
#include <Expert\Globals.mqh>

enum HighLowType {
    HL_NONE,
    HL_FRACTAL,
    HL_REGULAR,
    HL_WILLIAMS
};

// CBreakInfo Class Definition
class CBreakInfo : public CObject {
public:
    int timeframe;
    ENUM_BREAK_TYPE breakType;
    CCandle* breakCandle;
    bool mitigated;

    CBreakInfo(int tf);
};

// In HighLow.mqh erweitern
enum HighLowLevel {
    HL_LEVEL_NONE,
    HL_LEVEL_INTERNAL,  // Range-internes Level
    HL_LEVEL_STRUCTURE  // Strukturrelevantes Level
};

// CHighLow Class Definition
class CHighLow : public ITreeNode {
private:
    static int s_nextId;
    int m_id;
    CCandle* m_swingCandle;
    bool m_isHigh;
    HighLowType m_type;
    CArrayObj* m_breakInfoArray;
    
    CBreakInfo* GetBreakInfo(int timeframe);
    CBreakInfo* GetOrCreateBreakInfo(int timeframe);

public:
    HighLowLevel m_level;
 
    CHighLow(CCandle* candle, bool isHigh, HighLowType type, HighLowLevel level = HL_LEVEL_NONE);
    ~CHighLow();

    int getId() const;
    CCandle* getSwingCandle() const;
    bool isHigh() const;
    HighLowType getType() const;
    HighLowLevel getLevel() const { return m_level; }
    bool IsStructural() const { return m_level == HL_LEVEL_STRUCTURE; }

    void Update(HighLowType newType);
    void UpdateBreak(CCandle* breakCandle, ENUM_BREAK_TYPE breakType);
    ENUM_BREAK_TYPE getBreakType(int timeframe);
    CCandle* getLastBreakCandle(int timeframe);
    bool GetMitigatedStatus(int timeframe);
    void SetMitigatedStatus(int timeframe, bool status);
    virtual double GetTreeValue() const override;
    string toString();
};

// CBreakInfo Class Implementation
CBreakInfo::CBreakInfo(int tf) : timeframe(tf), breakType(BT_NONE), breakCandle(NULL), mitigated(false) {}

// CHighLow Class Implementation
int CHighLow::s_nextId = 1;

CHighLow::CHighLow(CCandle* candle, bool isHigh, HighLowType type, HighLowLevel level)
    : m_swingCandle(candle), m_isHigh(isHigh), m_type(type), m_level(level) {
    m_id = s_nextId++;
    m_breakInfoArray = new CArrayObj();
}

CHighLow::~CHighLow() {
    delete m_breakInfoArray;
}

int CHighLow::getId() const { return m_id; }
CCandle* CHighLow::getSwingCandle() const { return m_swingCandle; }
bool CHighLow::isHigh() const { return m_isHigh; }
HighLowType CHighLow::getType() const { return m_type; }

void CHighLow::Update(HighLowType newType) {
    if (newType > m_type) {
        m_type = newType;
    }
}

void CHighLow::UpdateBreak(CCandle* breakCandle, ENUM_BREAK_TYPE breakType) {
    CBreakInfo* info = GetOrCreateBreakInfo(breakCandle.timeframe);
    if (info.breakType == BT_NONE || (info.breakType == BT_SWEEP && breakType == BT_BREAK)) {
        info.breakType = breakType;
        info.breakCandle = breakCandle;
    }
}

ENUM_BREAK_TYPE CHighLow::getBreakType(int timeframe) {
    CBreakInfo* info = GetBreakInfo(timeframe);
    return (info != NULL) ? info.breakType : BT_NONE;
}

CCandle* CHighLow::getLastBreakCandle(int timeframe) {
    CBreakInfo* info = GetBreakInfo(timeframe);
    return (info != NULL) ? info.breakCandle : NULL;
}

bool CHighLow::GetMitigatedStatus(int timeframe) {
    CBreakInfo* info = GetBreakInfo(timeframe);
    return (info != NULL) ? info.mitigated : false;
}

void CHighLow::SetMitigatedStatus(int timeframe, bool status) {
    CBreakInfo* info = GetOrCreateBreakInfo(timeframe);
    info.mitigated = status;
}

double CHighLow::GetTreeValue() const override {
    return m_isHigh ? m_swingCandle.high : m_swingCandle.low;
}

string CHighLow::toString() {
    string result;
    string type;
    switch(m_type) {
        case HL_FRACTAL: type = "fractal"; break;
        case HL_REGULAR: type = "regular"; break;
        case HL_WILLIAMS: type = "williams"; break;
        default: type = "unknown"; break;
    }
    
    result = "HighLow ("+StringFormat("#%d", m_id)+") ";
    result += CHelper::TimeToString(getSwingCandle().openTime)+" "+CChartHelper::GetTimeframeName(getSwingCandle().timeframe)+" "+type+" "+(m_isHigh?"High":"Low");
    
    for (int i = 0; i < m_breakInfoArray.Total(); i++) {
        CBreakInfo* info = m_breakInfoArray.At(i);
        if (info.breakType != BT_NONE) {
            result += "\n  " + CChartHelper::GetTimeframeName(info.timeframe) + ": ";
            result += (info.breakType == BT_SWEEP ? "Swept" : "Broken") + " by " + CChartHelper::GetTimeframeName(info.breakCandle.timeframe) + " candle at " + CHelper::TimeToString(info.breakCandle.openTime);
            result += info.mitigated ? " (Mitigated)" : "";
        }
    }
    
    return result;
}

CBreakInfo* CHighLow::GetBreakInfo(int timeframe) {
    for (int i = 0; i < m_breakInfoArray.Total(); i++) {
        CBreakInfo* info = m_breakInfoArray.At(i);
        if (info.timeframe == timeframe) {
            return info;
        }
    }
    return NULL;
}

CBreakInfo* CHighLow::GetOrCreateBreakInfo(int timeframe) {
    CBreakInfo* info = GetBreakInfo(timeframe);
    if (info == NULL) {
        info = new CBreakInfo(timeframe);
        m_breakInfoArray.Add(info);
    }
    return info;
}

#endif // HIGHLOW_MQH


