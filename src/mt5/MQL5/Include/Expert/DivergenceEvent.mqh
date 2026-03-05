#ifndef DIVERGENCE_EVENT_MQH
#define DIVERGENCE_EVENT_MQH

#include <Expert\PriceLevel.mqh>
#include <Expert\HighLow.mqh>
#include <Expert\Event.mqh>
#include <Expert\ChartHelper.mqh>

// Enum für Divergenztypen
enum ENUM_DIVERGENCE_TYPE
{
    DIVERGENCE_SESSION,
    DIVERGENCE_TIME,
    DIVERGENCE_SWING
};

// Enum für den Typ des gebrochenen Levels
enum ENUM_BROKEN_LEVEL_TYPE
{
    BROKEN_PRICE_LEVEL,
    BROKEN_HIGH_LOW
};

class CDivergenceEvent : public CEvent
{
public:
    CPriceLevel*         m_brokenPriceLevel;
    CHighLow*            m_brokenHighLow;
    ENUM_BROKEN_LEVEL_TYPE m_brokenLevelType;
    int                  m_correlatedCloseDistance;
    ENUM_DIVERGENCE_TYPE m_divergenceType;
    int                  m_timeframe;
    int                  m_targetTimeframe;
    string               m_breakingPair;
    string               m_nonBreakingPair;
    datetime             m_correlatedHighLowTime;
    double               m_correlatedClosePrice;

public:
    CDivergenceEvent(const string symbol,
                     const ENUM_EVENT_TYPE type,
                     CPriceLevel* brokenLevel,
                     int correlatedCloseDistance,
                     const int timeframe,
                     const string breakingPair,
                     const string nonBreakingPair,
                     double correlatedClosePrice)
        : CEvent(symbol, type),
          m_brokenPriceLevel(brokenLevel),
          m_brokenHighLow(NULL),
          m_brokenLevelType(BROKEN_PRICE_LEVEL),
          m_correlatedCloseDistance(correlatedCloseDistance),
          m_timeframe(timeframe),
          m_targetTimeframe(0),
          m_breakingPair(breakingPair),
          m_nonBreakingPair(nonBreakingPair),
          m_correlatedHighLowTime(0),
          m_correlatedClosePrice(correlatedClosePrice)
    {
    }

    CDivergenceEvent(const string symbol,
                     const ENUM_EVENT_TYPE type,
                     CHighLow* brokenHighLow,
                     int correlatedCloseDistance,
                     const int timeframe,
                     const int targetTimeframe,
                     const string breakingPair,
                     const string nonBreakingPair,
                     const datetime correlatedHighLowTime,
                     double correlatedClosePrice)
        : CEvent(symbol, type),
          m_brokenPriceLevel(NULL),
          m_brokenHighLow(brokenHighLow),
          m_brokenLevelType(BROKEN_HIGH_LOW),
          m_correlatedCloseDistance(correlatedCloseDistance),
          m_timeframe(timeframe),
          m_targetTimeframe(targetTimeframe),
          m_breakingPair(breakingPair),
          m_nonBreakingPair(nonBreakingPair),
          m_correlatedHighLowTime(correlatedHighLowTime),
          m_correlatedClosePrice(correlatedClosePrice)
    {
    }

    CPriceLevel* GetBrokenPriceLevel() { return m_brokenPriceLevel; }
    CHighLow* GetBrokenHighLow() { return m_brokenHighLow; }
    ENUM_BROKEN_LEVEL_TYPE GetBrokenLevelType() { return m_brokenLevelType; }
    double GetDistanceNonBreakingAsset() { return m_correlatedCloseDistance; }
    string toString();
    virtual string GetDetails() override;
    virtual int GetOriginTimeframe() const override { return m_timeframe; }
    virtual int GetTargetTimeframe() const override { return m_targetTimeframe; }
    virtual ENUM_MARKET_DIRECTION GetMarketDirection() const override 
    { 
        return getEventType() == EV_BULLISH_DIVERGENCE_DETECTED || EV_BULLISH_DIVERGENCE_RESOLVED ? MARKET_DIRECTION_BULLISH : MARKET_DIRECTION_BEARISH;
    }
};

string CDivergenceEvent::toString() 
{
    string divergenceTypeStr = (getEventType() == EV_BULLISH_DIVERGENCE_DETECTED || getEventType() == EV_BULLISH_DIVERGENCE_RESOLVED) ? "Bullische" : "Bärische";
    string timeframeStr = CChartHelper::GetTimeframeName(m_timeframe);
    string eventType = (getEventType() == EV_BULLISH_DIVERGENCE_DETECTED || getEventType() == EV_BEARISH_DIVERGENCE_DETECTED) ? "erkannt" : "aufgelöst";
    string result = getSymbol()+"."+timeframeStr+" "+GetEventName()+": ";
    result += StringFormat("%s Divergenz %s auf %s, Timeframe: %s, ", 
                           divergenceTypeStr, eventType, m_symbol, timeframeStr);
    if (m_brokenLevelType == BROKEN_PRICE_LEVEL)
    {
        result += StringFormat("Durchbrochener Preis-Level: %f, ", m_brokenPriceLevel.GetPrice());
    }
    else
    {
        result += StringFormat("Durchbrochenes %s: %f, ", 
                               m_brokenHighLow.isHigh() ? "Hoch" : "Tief",
                               m_brokenHighLow.GetTreeValue());
    }
    result += StringFormat("Abstand zum korrelierten Level: %f", m_correlatedCloseDistance);
    return result;
}
    
string CDivergenceEvent::GetDetails()
{
    string divergenceTypeStr = (getEventType() == EV_BULLISH_DIVERGENCE_DETECTED || getEventType() == EV_BULLISH_DIVERGENCE_RESOLVED) ? "Bullische" : "Bärische";
    string timeframeStr = CChartHelper::GetTimeframeName(m_timeframe);
    string eventType = (getEventType() == EV_BULLISH_DIVERGENCE_DETECTED || getEventType() == EV_BEARISH_DIVERGENCE_DETECTED) ? "erkannt" : "aufgelöst";
    string result = getSymbol()+"."+CChartHelper::GetTimeframeName(m_timeframe)+" "+GetEventName()+": "+StringFormat("%s Divergenz %s,", divergenceTypeStr, eventType);
   
    result += "Breaking Symbol: "+m_breakingPair+"."+timeframeStr+", ";
    
    if (m_brokenLevelType == BROKEN_PRICE_LEVEL)
    {
        string levelTypeStr;
        string levelTimeStr;
        
        switch(m_brokenPriceLevel.GetType())
        {
            case LEVEL_DAILY:
                levelTypeStr = m_brokenPriceLevel.GetDirection() == LEVEL_HIGH ? "Daily High" : "Daily Low";
                levelTimeStr = TimeToString(m_brokenPriceLevel.GetTime(), TIME_DATE);
                break;
            case LEVEL_WEEKLY:
                levelTypeStr = m_brokenPriceLevel.GetDirection() == LEVEL_HIGH ? "Weekly High" : "Weekly Low";
                levelTimeStr = TimeToString(m_brokenPriceLevel.GetTime(), TIME_DATE);
                break;
            case LEVEL_MONTHLY:
                levelTypeStr = m_brokenPriceLevel.GetDirection() == LEVEL_HIGH ? "Monthly High" : "Monthly Low";
                levelTimeStr = TimeToString(m_brokenPriceLevel.GetTime(), TIME_DATE);
                break;
            case LEVEL_SESSION:
            {
                string levelTemp;
                levelTemp =  m_brokenPriceLevel.GetDirection() == LEVEL_HIGH ? "Session High" : "Session Low";
                levelTypeStr = m_brokenPriceLevel.GetSession().name+" "+levelTemp;                
                levelTimeStr = TimeToString(m_brokenPriceLevel.GetTime(), TIME_DATE);
                break;
            }
            default:
                levelTypeStr = "Unbekannt";
                levelTimeStr = "Unbekannt";
        }
        
        result += "Level: "+levelTypeStr+",";
        result += "Von: "+levelTimeStr;
    }
    else
    {
        string hlTypeStr = m_brokenHighLow.isHigh() ? "High" : "Low";
        string targetTimeframeStr = CChartHelper::GetTimeframeName(m_targetTimeframe);

        result += "Level: "+targetTimeframeStr+" "+hlTypeStr+",";
        result += "Von: "+TimeToString(m_brokenHighLow.getSwingCandle().openTime, TIME_DATE|TIME_MINUTES)+", ";      
    }
    
    if (m_correlatedHighLowTime != 0)
    {
       string hlTypeStr = m_brokenHighLow.isHigh() ? "High" : "Low";
       result += StringFormat("Zeit des korrelierten %s: %s,", 
                              hlTypeStr, 
                              TimeToString(m_correlatedHighLowTime, TIME_DATE|TIME_MINUTES));
    }

    result += StringFormat("Abstand zum korrelierten Level: %d Punkte", m_correlatedCloseDistance);
    
    return result;
}
#endif // DIVERGENCE_EVENT_MQH


