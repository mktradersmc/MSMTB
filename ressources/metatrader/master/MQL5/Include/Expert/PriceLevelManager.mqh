//+------------------------------------------------------------------+
//|                                                LevelDetector.mqh |
//|                                   Copyright 2022, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2022, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef PRICE_LEVEL_MANAGER_MQH
#define PRICE_LEVEL_MANAGER_MQH

#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Expert\PriceLevel.mqh>
#include <Expert\Session.mqh>
#include <Expert\Candle.mqh>
#include <Expert\RBTree.mqh>
#include <Expert\Globals.mqh>
#include <Expert\ChartHelper.mqh>
#include <Expert\PriceLevelBrokenEvent.mqh>
#include <Expert\EventStore.mqh>
#include <Expert\Event.mqh>
#include <Expert\PriceLevelCreatedEvent.mqh>
#include <Expert\ChartManager.mqh>
#include <Expert\Feature.mqh>

// CPriceLevelManager Class Definition
class CPriceLevelManager : public CFeature
{
private:
    CRBTree* m_highLevels;
    CRBTree* m_lowLevels;

    void UpdateDailyLevels(ENUM_LEVEL_TYPE type, CCandle* candle);
    void UpdateWeeklyLevels(ENUM_LEVEL_TYPE type,CCandle* candle);
    void UpdateMonthlyLevels(ENUM_LEVEL_TYPE type,CCandle* candle);
    void UpdateLevelForTimeframe(ENUM_LEVEL_TYPE type, CCandle* candle);
    void CheckBreaksAndSweeps(CCandle* candle);
    void CheckLevelsBreakAndSweep(CRBTree* tree, CCandle* candle, bool isHigh);
    bool CheckLevelBreakAndSweep(CPriceLevel* level, CCandle* candle);
    bool IsCorrespondingTime(datetime time1, datetime time2, ENUM_LEVEL_TYPE levelType);

public:
    CPriceLevelManager();
    ~CPriceLevelManager();

    virtual void Update(CCandle* candle) override;
    virtual void ProcessEvents() override;
    virtual string GetName() override;
    virtual void GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredTimeframes(int& timeframes[]) override;
    virtual void Initialize() override;
    virtual void Deinitialize() override;
    void AddSession(CSession* session);
    CPriceLevel* GetNextLowerLevel(double price);
    CPriceLevel* GetNextHigherLevel(double price);
    CPriceLevel* GetNextUnmitigatedHigherLevel(double price);
    CPriceLevel* GetNextUnmitigatedLowerLevel(double price);
    CPriceLevel* FindCorrespondingLevel(CPriceLevel* level);
};

// CPriceLevelManager Class Implementation
CPriceLevelManager::CPriceLevelManager()
{
    m_highLevels = new CRBTree("pricelevels_upper");
    m_lowLevels = new CRBTree("pricelevels_lower");
}

CPriceLevelManager::~CPriceLevelManager()
{
    delete m_highLevels;
    delete m_lowLevels;
}

string CPriceLevelManager::GetName() override {
    return "PriceLevelManager";
}

void CPriceLevelManager::ProcessEvents() override {
}

void CPriceLevelManager::GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
    ArrayResize(eventTypes, 8);
    eventTypes[0] = EV_PRICE_LEVEL_CREATED;
    eventTypes[1] = EV_HIGH_LEVEL_BROKEN;
    eventTypes[2] = EV_LOW_LEVEL_BROKEN;
    eventTypes[3] = EV_HIGH_LEVEL_SWEPT;
    eventTypes[4] = EV_LOW_LEVEL_SWEPT;
    eventTypes[5] = EV_PRICE_LEVEL_CREATED;
    eventTypes[6] = EV_HIGH_LEVEL_MITIGATED;
    eventTypes[7] = EV_LOW_LEVEL_MITIGATED;
}

void CPriceLevelManager::GetRequiredTimeframes(int& timeframes[]) override {
    ArrayResize(timeframes, 5);
    timeframes[0] = PERIOD_D1;  // Für Daily Levels
    timeframes[1] = PERIOD_W1;  // Für Weekly Levels
    timeframes[2] = PERIOD_MN1; // Für Monthly Levels
    timeframes[3] = PERIOD_H1;  // Für H1 Levels
    timeframes[4] = PERIOD_H4;  // Für H4 Levels
}

void CPriceLevelManager::GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 0);
}

void CPriceLevelManager::GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 0);
}

void CPriceLevelManager::Initialize() override {
    // Bereits im Konstruktor erledigt
}

void CPriceLevelManager::Deinitialize() override {
     // Cleanup wird bereits im Destruktor erledigt
}
    
CPriceLevel* CPriceLevelManager::GetNextLowerLevel(double price)
{
    return (CPriceLevel*)m_lowLevels.FindNextLower(price);
}

CPriceLevel* CPriceLevelManager::GetNextHigherLevel(double price)
{
    return (CPriceLevel*)m_highLevels.FindNextHigher(price);
}

CPriceLevel* CPriceLevelManager::GetNextUnmitigatedLowerLevel(double price)
{
    CPriceLevel* level = NULL;
    while (true)
    {
        level = m_highLevels.FindNextLower(price);
        if (level != NULL && level.GetMitigatedStatus(PERIOD_M1))
        {
            price = level.GetPrice();
        } 
        if (level == NULL)
           return NULL;
    }
    
    return level;
}

CPriceLevel* CPriceLevelManager::GetNextUnmitigatedHigherLevel(double price)
{
    CPriceLevel* level = NULL;
    while (true)
    {
        level = m_highLevels.FindNextHigher(price);
        if (level != NULL && level.GetMitigatedStatus(PERIOD_M1))
        {
            price = level.GetPrice();
        } 
        if (level == NULL)
           return NULL;
    }
    
    return level;
}

CPriceLevel* CPriceLevelManager::FindCorrespondingLevel(CPriceLevel* level)
{
    ENUM_LEVEL_TYPE levelType = level.GetType();
    ENUM_LEVEL_DIRECTION direction = level.GetDirection();
    datetime levelTime = level.GetTime();
    int timeframeId = level.GetTimeframeId();

    CRBTree* tree = (direction == LEVEL_HIGH) ? m_highLevels : m_lowLevels;
  
    for(int i = 0; i < tree.GetNodeCount(); i++)
    {
        CPriceLevel* currentLevel = tree.GetNodeAtIndex(i);
        if(currentLevel.GetType() == levelType && 
           currentLevel.GetDirection() == direction &&
           currentLevel.GetTimeframeId() == timeframeId &&
           IsCorrespondingTime(levelTime, currentLevel.GetTime(), levelType))
        {
            return currentLevel;
        }
    }

    return NULL;
}

bool CPriceLevelManager::IsCorrespondingTime(datetime time1, datetime time2, ENUM_LEVEL_TYPE levelType)
{
    MqlDateTime dt1, dt2;
    TimeToStruct(time1, dt1);
    TimeToStruct(time2, dt2);

    switch(levelType)
    {
        case LEVEL_SESSION:
            return time1 == time2;
        case LEVEL_DAILY:
            return (dt1.day == dt2.day && dt1.mon == dt2.mon && dt1.year == dt2.year);
        case LEVEL_WEEKLY:
            return (dt1.day_of_week == dt2.day_of_week &&
                   (int)((time1 - dt1.day_of_week * 86400) / 604800) ==
                   (int)((time2 - dt2.day_of_week * 86400) / 604800));
        case LEVEL_MONTHLY:
            return (dt1.mon == dt2.mon && dt1.year == dt2.year);
        case LEVEL_H1:
        case LEVEL_H4:
            return time1 == time2;
        default:
            return false;
    }
}

void CPriceLevelManager::AddSession(CSession* session)
{
    CPriceLevel* highLevel = new CPriceLevel(LEVEL_SESSION, LEVEL_HIGH, session.sessionHigh, session.endTime);
    highLevel.SetSession(session);
    m_highLevels.Insert(highLevel);

    CPriceLevelCreatedEvent* highEvent = new CPriceLevelCreatedEvent(session.GetSymbol(), EV_PRICE_LEVEL_CREATED, highLevel);
    CEventStore::GetInstance(session.GetSymbol()).AddEvent(highEvent);

    CPriceLevel* lowLevel = new CPriceLevel(LEVEL_SESSION, LEVEL_LOW, session.sessionLow, session.endTime);
    lowLevel.SetSession(session);
    m_lowLevels.Insert(lowLevel);

    CPriceLevelCreatedEvent* lowEvent = new CPriceLevelCreatedEvent(session.GetSymbol(), EV_PRICE_LEVEL_CREATED, lowLevel);
    CEventStore::GetInstance(session.GetSymbol()).AddEvent(lowEvent);
}

void CPriceLevelManager::Update(CCandle* candle) override
{     
    string message = "Update aufgerufen für Timeframe: " + CChartHelper::GetTimeframeName(candle.timeframe);
    CLogManager::GetInstance().LogMessage("CPriceLevelManager::Update", LL_DEBUG, message);
    
    if(candle.timeframe == PERIOD_D1) {
        message = "Verarbeite Daily Level";
        CLogManager::GetInstance().LogMessage("CPriceLevelManager::Update", LL_DEBUG, message);
        UpdateDailyLevels(LEVEL_DAILY, candle);
    }
    else if(candle.timeframe == PERIOD_W1) {
        message = "Verarbeite Weekly Level";
        CLogManager::GetInstance().LogMessage("CPriceLevelManager::Update", LL_DEBUG, message);
        UpdateWeeklyLevels(LEVEL_WEEKLY, candle);
    }
    else if(candle.timeframe == PERIOD_MN1) {
        message = "Verarbeite Monthly Level";
        CLogManager::GetInstance().LogMessage("CPriceLevelManager::Update", LL_DEBUG, message);
        UpdateMonthlyLevels(LEVEL_MONTHLY, candle);
    }
    else if(candle.timeframe == PERIOD_H1) {
        UpdateLevelForTimeframe(LEVEL_H1, candle);
    }
    else if(candle.timeframe == PERIOD_H4) {
        UpdateLevelForTimeframe(LEVEL_H4, candle);
    }
    
    CheckBreaksAndSweeps(candle);
}

void CPriceLevelManager::UpdateDailyLevels(ENUM_LEVEL_TYPE type, CCandle* candle)
{
    string message = StringFormat("UpdateDailyLevels aufgerufen - Candle High: %f, Low: %f, Open Time: %s", 
        candle.high, candle.low, TimeToString(candle.openTime));
    CLogManager::GetInstance().LogMessage("CPriceLevelManager::UpdateDailyLevels", LL_DEBUG, message);
    
    UpdateLevelForTimeframe(LEVEL_DAILY, candle);
}

void CPriceLevelManager::UpdateWeeklyLevels(ENUM_LEVEL_TYPE type, CCandle* candle)
{
    string message = StringFormat("UpdateWeeklyLevels aufgerufen - Candle High: %f, Low: %f, Open Time: %s", 
        candle.high, candle.low, TimeToString(candle.openTime));
    CLogManager::GetInstance().LogMessage("CPriceLevelManager::UpdateWeeklyLevels", LL_DEBUG, message);
    
    UpdateLevelForTimeframe(LEVEL_WEEKLY, candle);
}

void CPriceLevelManager::UpdateMonthlyLevels(ENUM_LEVEL_TYPE type, CCandle* candle)
{
    string message = StringFormat("UpdateMonthlyLevels aufgerufen - Candle High: %f, Low: %f, Open Time: %s", 
        candle.high, candle.low, TimeToString(candle.openTime));
    CLogManager::GetInstance().LogMessage("CPriceLevelManager::UpdateMonthlyLevels", LL_DEBUG, message);
    
    UpdateLevelForTimeframe(LEVEL_MONTHLY, candle);
}

void CPriceLevelManager::UpdateLevelForTimeframe(ENUM_LEVEL_TYPE type, CCandle* candle)
{
    string message = StringFormat("UpdateLevelForTimeframe aufgerufen - Type: %d, Symbol: %s, Timeframe: %s", 
        type, candle.symbol, CChartHelper::GetTimeframeName(candle.timeframe));
    CLogManager::GetInstance().LogMessage("CPriceLevelManager::UpdateLevelForTimeframe", LL_DEBUG, message);

    CBaseChart* chart = CChartManager::GetInstance().GetChart(candle.symbol, candle.timeframe);
    if(chart == NULL) {
        message = StringFormat("Fehler: Chart nicht gefunden für Symbol %s und Timeframe %s", 
            candle.symbol, CChartHelper::GetTimeframeName(candle.timeframe));
        CLogManager::GetInstance().LogMessage("CPriceLevelManager::UpdateLevelForTimeframe", LL_ERROR, message);
        return;
    }

    CPriceLevel* highLevel = new CPriceLevel(type, LEVEL_HIGH, candle.high, candle.openTime, candle.timeframe);
    CPriceLevel* lowLevel = new CPriceLevel(type, LEVEL_LOW, candle.low, candle.openTime, candle.timeframe);
    
    message = StringFormat("Neue Level erstellt - High: %f, Low: %f", candle.high, candle.low);
    CLogManager::GetInstance().LogMessage("CPriceLevelManager::UpdateLevelForTimeframe", LL_DEBUG, message);
    
    highLevel.SetCandle(candle);
    lowLevel.SetCandle(candle);
    
    // Bei H1/H4 Leveln: Alte Level des gleichen Typs entfernen
    if(type == LEVEL_H1 || type == LEVEL_H4)
    {
        for(int i = m_highLevels.GetNodeCount() - 1; i >= 0; i--)
        {
            CPriceLevel* level = m_highLevels.GetNodeAtIndex(i);
            if(level.GetType() == type)
                m_highLevels.Remove(level);
        }
        for(int i = m_lowLevels.GetNodeCount() - 1; i >= 0; i--)
        {
            CPriceLevel* level = m_lowLevels.GetNodeAtIndex(i);
            if(level.GetType() == type)
                m_lowLevels.Remove(level);
        }
    }

    m_highLevels.Insert(highLevel);
    message = "High Level eingefügt";
    CLogManager::GetInstance().LogMessage("CPriceLevelManager::UpdateLevelForTimeframe", LL_DEBUG, message);

    m_lowLevels.Insert(lowLevel);
    message = "Low Level eingefügt";
    CLogManager::GetInstance().LogMessage("CPriceLevelManager::UpdateLevelForTimeframe", LL_DEBUG, message);

    CPriceLevelCreatedEvent* highEvent = new CPriceLevelCreatedEvent(candle.symbol, EV_PRICE_LEVEL_CREATED, highLevel);
    CEventStore::GetInstance(candle.symbol).AddEvent(highEvent);

    CPriceLevelCreatedEvent* lowEvent = new CPriceLevelCreatedEvent(candle.symbol, EV_PRICE_LEVEL_CREATED, lowLevel);
    CEventStore::GetInstance(candle.symbol).AddEvent(lowEvent);
    
    message = "Events für neue Level erstellt und dem EventStore hinzugefügt";
    CLogManager::GetInstance().LogMessage("CPriceLevelManager::UpdateLevelForTimeframe", LL_DEBUG, message);
}

void CPriceLevelManager::CheckBreaksAndSweeps(CCandle* candle)
{
    CheckLevelsBreakAndSweep(m_highLevels, candle, true);
    CheckLevelsBreakAndSweep(m_lowLevels, candle, false);
}

void CPriceLevelManager::CheckLevelsBreakAndSweep(CRBTree* tree, CCandle* candle, bool isHigh)
{
    CPriceLevel* level = NULL;
    if (isHigh)
    {
        level = (CPriceLevel*)tree.FindNextLower(candle.high);
        while (level != NULL)
        {
            if (!CheckLevelBreakAndSweep(level, candle))
                break;
            level = (CPriceLevel*)tree.FindNextLower(level.GetTreeValue());
        }
    }
    else
    {
        level = (CPriceLevel*)tree.FindNextHigher(candle.low);
        while (level != NULL)
        {
            if (!CheckLevelBreakAndSweep(level, candle))
                break;
            level = (CPriceLevel*)tree.FindNextHigher(level.GetTreeValue());
        }
    }
}

bool CPriceLevelManager::CheckLevelBreakAndSweep(CPriceLevel* level, CCandle* candle)
{
    ENUM_BREAK_TYPE breakType = BT_NONE;

    if(level.GetDirection() == LEVEL_HIGH)
    {
        if(candle.high > level.GetPrice() && candle.openTime >= level.GetTime())
        {
            breakType = (candle.close > level.GetPrice()) ? BT_BREAK : BT_SWEEP;
        }
        else
        {
            return false;
        }
    }
    else if(level.GetDirection() == LEVEL_LOW)
    {
        if(candle.low < level.GetPrice() && candle.openTime >= level.GetTime())
        {
            breakType = (candle.close < level.GetPrice()) ? BT_BREAK : BT_SWEEP;
        }
        else
        {
            return false;
        }
    }

    if(breakType != BT_NONE)
    {
        ENUM_BREAK_TYPE currentStatus = level.GetBreakStatus(candle.timeframe);
        ENUM_BREAK_TYPE newStatus = level.SetBreakStatus(candle.timeframe, breakType);

        if(newStatus > currentStatus)
        {
            ENUM_EVENT_TYPE eventType;
            if(level.GetDirection() == LEVEL_HIGH)
            {
                eventType = (newStatus == BT_BREAK) ? EV_HIGH_LEVEL_BROKEN : EV_HIGH_LEVEL_SWEPT;
            }
            else
            {
                eventType = (newStatus == BT_BREAK) ? EV_LOW_LEVEL_BROKEN : EV_LOW_LEVEL_SWEPT;
            }

            CPriceLevelBrokenEvent* event = new CPriceLevelBrokenEvent(candle.symbol, eventType, level, candle);
            CEventStore::GetInstance(candle.symbol).AddEvent(event);

            // Neue MITIGATED Logik
            if (!level.GetMitigatedStatus(candle.timeframe))
            {
                ENUM_EVENT_TYPE mitigatedEventType = (level.GetDirection() == LEVEL_HIGH) ? EV_HIGH_LEVEL_MITIGATED : EV_LOW_LEVEL_MITIGATED;
                CPriceLevelBrokenEvent* mitigatedEvent = new CPriceLevelBrokenEvent(candle.symbol, mitigatedEventType, level, candle);
                CEventStore::GetInstance(candle.symbol).AddEvent(mitigatedEvent);
                level.SetMitigatedStatus(candle.timeframe, true);
            }
        }

        if (level.GetType() == LEVEL_SESSION)
        {
            if (candle.timeframe == PERIOD_D1 && candle.openTime >= level.GetTime())
            {
                if (level.GetDirection()==LEVEL_HIGH)
                    m_highLevels.Remove(level);
                else
                    m_lowLevels.Remove(level);
            }
        }
        else
        {
            if (breakType == BT_BREAK && candle.openTime >= level.GetTime() &&
                ((level.GetType() == LEVEL_DAILY && candle.timeframe == PERIOD_D1) ||
                 (level.GetType() == LEVEL_WEEKLY && candle.timeframe == PERIOD_W1) ||
                 (level.GetType() == LEVEL_MONTHLY && candle.timeframe == PERIOD_MN1)))
            {
                if (level.GetDirection()==LEVEL_HIGH)
                    m_highLevels.Remove(level);
                else
                    m_lowLevels.Remove(level);
            }
        }
    }

    return true;
}

#endif // PRICE_LEVEL_MANAGER_MQH


