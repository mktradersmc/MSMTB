//+------------------------------------------------------------------+
//|                                            SessionDefinition.mqh |
//|                                  Copyright 2023, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#ifndef SESSION_DEFINITION_MQH
#define SESSION_DEFINITION_MQH

#include <Object.mqh>
#include <Expert\Helper.mqh>

// Enum für Session-Typen
enum ENUM_SESSION_TYPE
{
    SESSION_TYPE_TRADING,    // Sessions für aktives Trading
    SESSION_TYPE_LIQUIDITY   // Sessions für Liquiditätsanalyse
};

class CSessionDefinition : public CObject
{
private:
    string m_id;              // Eindeutige ID der Session
    string m_name;            // Beschreibender Name
    int m_startTimeMinutes;   // Minuten seit Mitternacht
    int m_endTimeMinutes;     // Minuten seit Mitternacht
    string m_timezone;        // Zeitzone als String (UTC+X, GMT+X oder Identifier)
    ENUM_SESSION_TYPE m_type; // Typ der Session

public:
    CSessionDefinition()
        : m_id(""), m_name(""), m_startTimeMinutes(0), m_endTimeMinutes(0), 
          m_timezone(""), m_type(SESSION_TYPE_TRADING) {}
    
    // Getter/Setter
    void SetId(const string id) { m_id = id; }
    string GetId() const { return m_id; }
    
    void SetName(const string name) { m_name = name; }
    string GetName() const { return m_name; }
    
    void SetStartTime(int minutes) { m_startTimeMinutes = minutes; }
    int GetStartTime() const { return m_startTimeMinutes; }
    
    void SetEndTime(int minutes) { m_endTimeMinutes = minutes; }
    int GetEndTime() const { return m_endTimeMinutes; }
    
    void SetTimezone(string timezone) { m_timezone = timezone; }
    string GetTimezone() const { return m_timezone; }
    
    void SetType(ENUM_SESSION_TYPE type) { m_type = type; }
    ENUM_SESSION_TYPE GetType() const { return m_type; }
    
    // Hilfsmethoden
    bool IsLiquiditySession() const { return m_type == SESSION_TYPE_LIQUIDITY; }
    bool IsTradingSession() const { return m_type == SESSION_TYPE_TRADING; }
    
    string ToString() const
    {
        string typeStr = m_type == SESSION_TYPE_TRADING ? "Trading" : "Liquidity";
        
        return StringFormat(
            "Session-Definition: ID=%s, Name=%s, Start=%02d:%02d, End=%02d:%02d, Timezone: %s, Type=%s",
            m_id, m_name,
            m_startTimeMinutes / 60, m_startTimeMinutes % 60,
            m_endTimeMinutes / 60, m_endTimeMinutes % 60,
            m_timezone,
            typeStr
        );
    }
};

#endif


