//+------------------------------------------------------------------+
//|                                              SessionManager.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "1.08"
#property strict

#ifndef SESSION_MANAGER_MQH
#define SESSION_MANAGER_MQH

#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Expert\Globals.mqh>
#include <Expert\Helper.mqh>
#include <Expert\Event.mqh>
#include <Expert\EventStore.mqh>
#include <Expert\TradingSessionEvent.mqh>
#include <Expert\SessionStatusEvent.mqh>
#include <Expert\SessionDefinition.mqh>
#include <Expert\PriceLevelManager.mqh>
#include <Expert\Session.mqh>
#include <Expert\LogManager.mqh>
#include <Expert\EnvironmentManager.mqh>

class CSessionManager : public CObject
{
private:
    class CSymbolSessions : public CObject
    {
    public:
        string symbol;
        CArrayObj* sessions;
        
        CSymbolSessions(const string& symbolName) : symbol(symbolName) {
            sessions = new CArrayObj();
        }
        
        ~CSymbolSessions() {
            if(sessions != NULL) {
                for(int i = sessions.Total()-1; i >= 0; i--) {
                    delete sessions.At(i);
                }
                delete sessions;
            }
        }
    };
    
    CArrayObj* m_sessionDefinitions;    // Original Session-Definitionen
    CArrayObj* m_symbolSessions;        // Array von CSymbolSessions - aktive Sessions pro Symbol
    datetime m_lastTickTime;
    bool m_tradingActive;
    bool m_initialized;
    bool m_sessionDefinitionsProvided;

    static CSessionManager* m_instance;

    CSessionManager();
    
    bool IsInActiveSession(const string symbol, const datetime currentTime);
    void InitializeExistingSessions(const string symbol, const datetime currentTime);
    bool IsNewMinute(const datetime tickTime);
    void ProcessNewMinute(const string symbol, const datetime currentTime, const double high, const double low, const datetime candleTime);
    void UpdateSessionTimes(CSession* session, const CSessionDefinition* def, const datetime currentTime);
    CArrayObj* GetSymbolSessions(const string symbol, const bool createIfNotExists = false);

public:
    ~CSessionManager();
    
    static CSessionManager* GetInstance();
    void SetSessionDefinitions(CArrayObj* definitions);
    void Update(const MqlTick& tick);
    bool IsTradingActive() const { return m_tradingActive; }
    CSession* GetCurrentTradingSession(const string symbol, const datetime currentTime);
};

CSessionManager* CSessionManager::m_instance = NULL;

CSessionManager::CSessionManager()
{
    m_sessionDefinitions = new CArrayObj();
    m_symbolSessions = new CArrayObj();
    m_lastTickTime = 0;
    m_tradingActive = false;
    m_initialized = false;
    m_sessionDefinitionsProvided = false;
}

CSessionManager::~CSessionManager()
{
    if(m_sessionDefinitions != NULL)
    {
        for(int i = 0; i < m_sessionDefinitions.Total(); i++)
        {
            delete m_sessionDefinitions.At(i);
        }
        delete m_sessionDefinitions;
    }
    
    if(m_symbolSessions != NULL)
    {
        for(int i = 0; i < m_symbolSessions.Total(); i++)
        {
            delete m_symbolSessions.At(i);
        }
        delete m_symbolSessions;
    }
}

CSessionManager* CSessionManager::GetInstance()
{
    if(m_instance == NULL)
    {
        m_instance = new CSessionManager();
    }
    return m_instance;
}

CArrayObj* CSessionManager::GetSymbolSessions(const string symbol, const bool createIfNotExists = false)
{
    // Suche existierende Sessions für das Symbol
    for(int i = 0; i < m_symbolSessions.Total(); i++)
    {
        CSymbolSessions* symbolSessions = m_symbolSessions.At(i);
        if(symbolSessions.symbol == symbol)
        {
            return symbolSessions.sessions;
        }
    }
    
    // Wenn nicht gefunden und createIfNotExists = true, erstelle neue Sessions
    if(createIfNotExists)
    {
        CSymbolSessions* newSymbolSessions = new CSymbolSessions(symbol);
        m_symbolSessions.Add(newSymbolSessions);
        return newSymbolSessions.sessions;
    }
    
    return NULL;  // Symbol nicht gefunden und soll nicht erstellt werden
}

void CSessionManager::SetSessionDefinitions(CArrayObj* definitions)
{
    // Clear existing definitions
    for(int i = 0; i < m_sessionDefinitions.Total(); i++)
    {
        delete m_sessionDefinitions.At(i);
    }
    m_sessionDefinitions.Clear();
    
    // Clear all symbol sessions
    for(int i = 0; i < m_symbolSessions.Total(); i++)
    {
        delete m_symbolSessions.At(i);
    }
    m_symbolSessions.Clear();

    // Copy new definitions
    for(int i = 0; i < definitions.Total(); i++)
    {
        CSessionDefinition* def = definitions.At(i);
        
        CSessionDefinition* newDefinition = new CSessionDefinition();
        newDefinition.SetId(def.GetId());
        newDefinition.SetName(def.GetName());
        newDefinition.SetStartTime(def.GetStartTime());
        newDefinition.SetEndTime(def.GetEndTime());
        newDefinition.SetTimezone(def.GetTimezone());
        newDefinition.SetType(def.GetType());
        
        string message = StringFormat("Added session definition %s with timezone %s", 
                                  newDefinition.GetName(), 
                                  newDefinition.GetTimezone());
        CLogManager::GetInstance().LogMessage("CSessionManager::SetSessionDefinitions", LL_DEBUG, message);
        
        m_sessionDefinitions.Add(newDefinition);
    }
    
    m_sessionDefinitionsProvided = true;
}

void CSessionManager::Update(const MqlTick& tick)
{
    if(!m_sessionDefinitionsProvided) return;
    
    if(IsNewMinute(tick.time))
    {
        string message = "New minute detected at: " + CHelper::TimeToString(tick.time);
        CLogManager::GetInstance().LogMessage("CSessionManager::Update", LL_DEBUG, message);
        
        // Hole IMMER die letzte abgeschlossene Minute für das Hauptsymbol
        MqlRates rates[];
        ArraySetAsSeries(rates, true);
        if(CopyRates(_Symbol, PERIOD_M1, 1, 1, rates) > 0)
        {
            message = StringFormat("Main Symbol %s Candle - Time: %s High: %.5f Low: %.5f", 
                               _Symbol,
                               CHelper::TimeToString(rates[0].time),
                               rates[0].high,
                               rates[0].low);
            CLogManager::GetInstance().LogMessage("CSessionManager::Update", LL_DEBUG, message);
            
            ProcessNewMinute(_Symbol, tick.time, rates[0].high, rates[0].low, rates[0].time);
            
            // Verarbeite das korrelierte Symbol, falls vorhanden
            if(CEnvironmentManager::GetInstance().HasActiveCorrelatedSymbol(_Symbol))
            {
                string corrSymbol = CEnvironmentManager::GetInstance().GetCorrelatedSymbol(_Symbol);
                datetime startWait = GetTickCount64();
                bool corrCandleFound = false;
                
                // Versuche bis zu 200ms lang, die korrekte Kerze zu bekommen
                while(GetTickCount64() - startWait < 200)  // 200ms Timeout
                {
                    MqlRates corrRates[];
                    ArraySetAsSeries(corrRates, true);
                    
                    if(CopyRates(corrSymbol, PERIOD_M1, 1, 1, corrRates) > 0)
                    {
                        
                        // Wenn wir die passende Kerze gefunden haben
                        if(corrRates[0].time == rates[0].time)
                        {
                            ProcessNewMinute(corrSymbol, tick.time, corrRates[0].high, corrRates[0].low, corrRates[0].time);
                            corrCandleFound = true;
                            
                            message = StringFormat("Correlated Symbol %s Candle - Time: %s High: %.5f Low: %.5f", 
                                               corrSymbol,
                                               CHelper::TimeToString(corrRates[0].time),
                                               corrRates[0].high,
                                               corrRates[0].low);
                            CLogManager::GetInstance().LogMessage("CSessionManager::Update", LL_DEBUG, message);
                            message = StringFormat("Found matching candle for %s after %d ms", 
                                               corrSymbol,
                                               GetTickCount64() - startWait);
                            CLogManager::GetInstance().LogMessage("CSessionManager::Update", LL_INFO, message);
                            break;
                        }
                        
                        // Kurze Pause zwischen den Versuchen
                        Sleep(5);
                    }
                }
                
                if(!corrCandleFound)
                {
                    message = StringFormat("ERROR: Could not get matching candle for %s at time %s after 200ms timeout", 
                                       corrSymbol,
                                       CHelper::TimeToString(rates[0].time));
                    CLogManager::GetInstance().LogMessage("CSessionManager::Update", LL_ERROR, message);
                }
            }
        }
    }
}

void CSessionManager::UpdateSessionTimes(CSession* session, const CSessionDefinition* def, const datetime currentTime)
{
    int source_offset = 0;
    int broker_offset = 0;
    string timezone = def.GetTimezone();
    
    // 1. Schritt: Berechne Offset von Quellzeitzone zu UTC
    if(StringFind(timezone, "UTC") == 0 || StringFind(timezone, "GMT") == 0)
    {
        string offsetStr = StringSubstr(timezone, 3);
        source_offset = (int)StringToInteger(offsetStr);
    }
    else
    {
        source_offset = CEnvironmentManager::GetInstance().GetUTCOffset(timezone, currentTime);
    }
    
    // 2. Schritt: Berechne Offset von UTC zu Broker-Zeitzone
    broker_offset = CEnvironmentManager::GetInstance().GetUTCOffset("Broker", currentTime);
    
    // Berechne die Gesamtverschiebung: 
    // Zeit -> UTC -> Broker = Zeit - source_offset + broker_offset
    int total_offset = -source_offset + broker_offset;

    // Berechne die angepassten Zeiten
    int adjustedStartTime = def.GetStartTime() + (total_offset * 60);
    int adjustedEndTime = def.GetEndTime() + (total_offset * 60);

    adjustedStartTime = MathMod(adjustedStartTime, 1440);
    adjustedEndTime = MathMod(adjustedEndTime, 1440);

    // Setze die Zeiten in der Session
    MqlDateTime dt;
    TimeToStruct(currentTime, dt);
    
    dt.hour = adjustedStartTime / 60;
    dt.min = MathMod(adjustedStartTime, 60);
    dt.sec = 0;
    session.startTime = StructToTime(dt);
    
    dt.hour = adjustedEndTime / 60;
    dt.min = MathMod(adjustedEndTime, 60);
    session.endTime = StructToTime(dt);
    
    // Wenn Ende vor Start liegt, füge einen Tag hinzu
    if(adjustedEndTime < adjustedStartTime)
    {
        session.endTime += 24 * 3600;
        
        // Wenn aktuelle Zeit nach Mitternacht liegt, passe Start- und Endzeit an
        int currentMinutes = (dt.hour * 60 + dt.min);
        if(currentMinutes < adjustedEndTime)
        {
            session.startTime -= 24 * 3600;
            session.endTime -= 24 * 3600;
        }
    }
    
    string message = StringFormat("Updated session times for %s - Source TZ: %s (UTC%+d), Broker TZ: UTC%+d, Total offset: %+d\n" +
                                "Start: %s, End: %s",
                                session.name,
                                timezone,
                                source_offset,
                                broker_offset,
                                total_offset,
                                TimeToString(session.startTime),
                                TimeToString(session.endTime));
    CLogManager::GetInstance().LogMessage("CSessionManager::UpdateSessionTimes", LL_DEBUG, message);
}

void CSessionManager::ProcessNewMinute(const string symbol, const datetime currentTime, const double high, const double low, const datetime candleTime)
{
    // Initialisierung beim ersten Update
    if(!m_initialized)
    {
        InitializeExistingSessions(symbol, currentTime);
        m_initialized = true;
        return;
    }

    MqlDateTime dt;
    TimeToStruct(currentTime, dt);
    int currentMinutes = (dt.hour * 60 + dt.min);

    CArrayObj* symbolSessions = GetSymbolSessions(symbol, true);
    
    // Check for new sessions to start
    for(int i = 0; i < m_sessionDefinitions.Total(); i++)
    {
        CSessionDefinition* definition = m_sessionDefinitions.At(i);
        
        // Berechne die angepasste Startzeit mit aktueller Zeitzone
        int source_offset = 0;
        int broker_offset = 0;
        string timezone = definition.GetTimezone();
        
        // 1. Schritt: Berechne Offset von Quellzeitzone zu UTC
        if(StringFind(timezone, "UTC") == 0 || StringFind(timezone, "GMT") == 0)
        {
            string offsetStr = StringSubstr(timezone, 3);
            source_offset = (int)StringToInteger(offsetStr);
        }
        else
        {
            source_offset = CEnvironmentManager::GetInstance().GetUTCOffset(timezone, currentTime);
        }
        
        // 2. Schritt: Berechne Offset von UTC zu Broker-Zeitzone
        broker_offset = CEnvironmentManager::GetInstance().GetUTCOffset("Broker", currentTime);
        
        // Berechne die Gesamtverschiebung
        int total_offset = -source_offset + broker_offset;

        // Berechne die angepasste Startzeit
        int adjustedStartTime = definition.GetStartTime() + (total_offset * 60);
        adjustedStartTime = MathMod(adjustedStartTime, 1440);
        
        if(adjustedStartTime == currentMinutes)
        {
             CSession* newSession = new CSession(symbol);
             newSession.id = definition.GetId();
             newSession.name = definition.GetName();
             newSession.keyLevel = definition.GetType() == SESSION_TYPE_LIQUIDITY;
             newSession.trading = definition.GetType() == SESSION_TYPE_TRADING;
             
             UpdateSessionTimes(newSession, definition, currentTime);
             
             symbolSessions.Add(newSession);
             
             string message = "New session created: " + newSession.toString();
             CLogManager::GetInstance().LogMessage("CSessionManager::ProcessNewMinute", LL_DEBUG, message);
             
             CEvent* sessionStarted = new CSessionStatusEvent(symbol, EV_SESSION_STARTED, newSession);
             CEventStore::GetInstance(symbol).AddEvent(sessionStarted);

             if(newSession.trading)
             {
                 CEvent* activateEvent = new CTradingSessionEvent(symbol, EV_ACTIVATE_TRADING);
                 CEventStore::GetInstance(symbol).AddEvent(activateEvent);
                 m_tradingActive = true;
             }
        }
    }
    
    // Update and check active sessions
    for(int i = symbolSessions.Total() - 1; i >= 0; i--)
    {
        CSession* session = symbolSessions.At(i);
        
        // Die Kerze gehört zur Session wenn sie zwischen Start und Ende (inkl.) liegt
        if(candleTime >= session.startTime && candleTime <= session.endTime)
        {
            session.UpdateLevels(high, low);
        }
        
        // Session-Ende wird anhand der aktuellen Zeit geprüft
        if(currentTime >= session.endTime)
        {
            CEvent* sessionEnded = new CSessionStatusEvent(symbol, EV_SESSION_ENDED, session);
            CEventStore::GetInstance(symbol).AddEvent(sessionEnded);

            if(session.keyLevel)
            {
                if (CEnvironmentManager::GetInstance().IsFeatureActive(symbol,"PriceLevelManager"))
                {
                    CFeature* feature = CEnvironmentManager::GetInstance().GetFeatureForSymbol(symbol,"PriceLevelManager");
                    ((CPriceLevelManager*)feature).AddSession(session);
                }
            }

            if(session.trading)
            {
                CEvent* deactivateEvent = new CTradingSessionEvent(symbol, EV_DEACTIVATE_TRADING);
                CEventStore::GetInstance(symbol).AddEvent(deactivateEvent);
                m_tradingActive = false;
            }

            symbolSessions.Detach(i);
        }
    }
}

void CSessionManager::InitializeExistingSessions(const string symbol, const datetime currentTime)
{
    string message = "Initialize Existing Sessions "+CHelper::TimeToString(currentTime);
    CLogManager::GetInstance().LogMessage("CSessionManager::InitializeExistingSessions",LL_DEBUG,message);

    CArrayObj* symbolSessions = GetSymbolSessions(symbol, true);

    for(int i = 0; i < m_sessionDefinitions.Total(); i++)
    {
        CSessionDefinition* definition = m_sessionDefinitions.At(i);
        CSession* newSession = new CSession(symbol);
        newSession.id = definition.GetId();
        newSession.name = definition.GetName();
        newSession.keyLevel = definition.GetType() == SESSION_TYPE_LIQUIDITY;
        newSession.trading = definition.GetType() == SESSION_TYPE_TRADING;
        
        UpdateSessionTimes(newSession, definition, currentTime);
            
        // Wenn aktuelle Zeit in der Session liegt
        if(currentTime >= newSession.startTime && currentTime < newSession.endTime)
        {
            symbolSessions.Add(newSession);
            
            CEvent* sessionStarted = new CSessionStatusEvent(symbol, EV_SESSION_STARTED, newSession);
            CEventStore::GetInstance(symbol).AddEvent(sessionStarted);
            
            message = "Active Session found "+newSession.toString();
            CLogManager::GetInstance().LogMessage("CSessionManager::InitializeExistingSessions",LL_DEBUG,message);
        
            if(newSession.trading)
            {
                CEvent* activateEvent = new CTradingSessionEvent(symbol, EV_ACTIVATE_TRADING);
                CEventStore::GetInstance(symbol).AddEvent(activateEvent);
                m_tradingActive = true;
            }
        }
        else
        {
            delete newSession;
        }
    }
}

bool CSessionManager::IsNewMinute(const datetime tickTime)
{
    if(m_lastTickTime == 0)
    {
        m_lastTickTime = tickTime;
        return true;
    }
    
    MqlDateTime lastDT, currentDT;
    TimeToStruct(m_lastTickTime, lastDT);
    TimeToStruct(tickTime, currentDT);
    
    bool isNewMinute = (lastDT.min != currentDT.min || lastDT.hour != currentDT.hour || lastDT.day != currentDT.day);
    
    m_lastTickTime = tickTime;
    return isNewMinute;
}

bool CSessionManager::IsInActiveSession(const string symbol, const datetime currentTime)
{
    CArrayObj* symbolSessions = GetSymbolSessions(symbol);
    if(symbolSessions == NULL) return false;
    
    for(int i = 0; i < symbolSessions.Total(); i++)
    {
        CSession* session = symbolSessions.At(i);
        if(session.trading && session.IsInSession(currentTime))
        {
            return true;
        }
    }
    return false;
}

CSession* CSessionManager::GetCurrentTradingSession(const string symbol, const datetime currentTime)
{
    CArrayObj* symbolSessions = GetSymbolSessions(symbol);
    if(symbolSessions == NULL) return NULL;
    
    for(int i = 0; i < symbolSessions.Total(); i++)
    {
        CSession* session = symbolSessions.At(i);
        if(session.trading && session.IsInSession(currentTime))
        {
            return session;
        }
    }
    
    return NULL;
}

#endif


