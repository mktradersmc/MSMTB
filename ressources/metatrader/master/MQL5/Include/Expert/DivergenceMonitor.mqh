#ifndef DIVERGENCE_MONITOR_MQH
#define DIVERGENCE_MONITOR_MQH

#include <Arrays/ArrayObj.mqh>
#include <Expert\Event.mqh>
#include <Expert\DivergenceEvent.mqh>
#include <Expert\EventStore.mqh>
#include <Expert\LogManager.mqh>
#include <Expert\HighLowBrokenEvent.mqh>
#include <Expert\PriceLevelBrokenEvent.mqh>
#include <Expert\IConditionProvider.mqh>

class CDivergenceMonitor : public IConditionProvider
{
private:
    // Innere Klasse für die Instance-Daten
    class CInstanceData : public CObject
    {
    public:
        string symbol;
        CDivergenceMonitor* instance;
        
        CInstanceData(string s, CDivergenceMonitor* i) : symbol(s), instance(i) {}
    };

    static CArrayObj s_instances;
    string m_symbol;
    string m_correlatedSymbol;
    CArrayObj* m_activeDivergences;
    int m_lastProcessedEventId;
    int m_lastProcessedCorrelatedEventId;
    
    // Privater Konstruktor für Singleton
    CDivergenceMonitor(string symbol);
    
    // Private Methode zum Finden einer Instanz
    static CDivergenceMonitor* FindInstance(string symbol);
    
public:
    ~CDivergenceMonitor();
    
    // Statische Methode zum Erhalt oder Erstellen einer Instanz
    static CDivergenceMonitor* GetInstance(string symbol);
    
    void OnInit();
    void SetCorrelatedSymbol(string symbol);
    void ProcessEvents();
    void ResetDivergences();
    
    // Implementation des IConditionProvider Interface
    virtual bool ValidateCondition(const string& params[]) override;
    virtual string GetConditionDetails(const string& params[]) override;
    virtual string GetConditionDescription(const string& params[]) override;
    virtual int GetRequiredParameterCount() override;
    
private:
    void ProcessSymbolEvents(CEvent* event);
    void CheckDivergenceResolution(CEvent* mitigationEvent);
    void CreateDivergenceResolutionEvent(CDivergenceEvent* originalDivergence, ENUM_EVENT_TYPE resolutionType);
    bool HasActiveDivergence(ENUM_EVENT_TYPE divergenceType);
};

// Initialisierung der statischen Member-Variable
CArrayObj CDivergenceMonitor::s_instances;

CDivergenceMonitor::CDivergenceMonitor(string symbol)
    : m_symbol(symbol), m_correlatedSymbol(""), m_lastProcessedEventId(0), m_lastProcessedCorrelatedEventId(0)
{
    m_activeDivergences = new CArrayObj();
}

CDivergenceMonitor::~CDivergenceMonitor()
{
    while(m_activeDivergences.Total()>0)
       m_activeDivergences.Detach(0);
    delete m_activeDivergences;
}

CDivergenceMonitor* CDivergenceMonitor::FindInstance(string symbol)
{
    for(int i = 0; i < s_instances.Total(); i++)
    {
        CInstanceData* data = s_instances.At(i);
        if(data.symbol == symbol)
            return data.instance;
    }
    return NULL;
}

void CDivergenceMonitor::ResetDivergences()
{
    while(m_activeDivergences.Total()>0)
       m_activeDivergences.Detach(0);
}

CDivergenceMonitor* CDivergenceMonitor::GetInstance(string symbol)
{
    CDivergenceMonitor* instance = FindInstance(symbol);
    if(instance == NULL)
    {
        instance = new CDivergenceMonitor(symbol);
        s_instances.Add(new CInstanceData(symbol, instance));
    }
    return instance;
}

void CDivergenceMonitor::SetCorrelatedSymbol(string symbol)
{
    m_correlatedSymbol = symbol;
}

void CDivergenceMonitor::OnInit()
{
   m_lastProcessedEventId = CEventStore::GetInstance(m_symbol).GetLastEventId();
   m_lastProcessedCorrelatedEventId = CEventStore::GetInstance(m_correlatedSymbol).GetLastEventId();
}

void CDivergenceMonitor::ProcessEvents()
{
    if(m_correlatedSymbol == "")
        return;
        
    // Verarbeite Events für das Hauptsymbol
    CEvent* newEvents[];
    CEvent* newCorrelatedEvents[];
    int count = CEventStore::GetInstance(m_symbol).GetNewEvents(m_lastProcessedEventId, newEvents);
    for(int i = 0; i < count; i++)
    {
        ProcessSymbolEvents(newEvents[i]);
        m_lastProcessedEventId = newEvents[i].id;
    }
    
    // Verarbeite Events für das korrelierte Symbol
    if(m_correlatedSymbol != "")
    {
        count = CEventStore::GetInstance(m_correlatedSymbol).GetNewEvents(m_lastProcessedCorrelatedEventId, newCorrelatedEvents);
        for(int i = 0; i < count; i++)
        {
            ProcessSymbolEvents(newCorrelatedEvents[i]);
            m_lastProcessedCorrelatedEventId = newCorrelatedEvents[i].id;
        }
    }
}

void CDivergenceMonitor::ProcessSymbolEvents(CEvent* event)
{
    string message;
    string eventSymbol = event.getSymbol();
    
    // Wenn es ein Divergenz-Event ist, speichern wir es
    if(event.getEventType() == EV_BULLISH_DIVERGENCE_DETECTED || 
       event.getEventType() == EV_BEARISH_DIVERGENCE_DETECTED)
    {
        if(eventSymbol == m_symbol)  // Nur Divergenzen des Hauptsymbols speichern
        {
            CDivergenceEvent* divergenceEvent = (CDivergenceEvent*)event;
            if(divergenceEvent != NULL)
            {
                message = "Neue Divergenz gefunden: " + divergenceEvent.toString();
                CLogManager::GetInstance().LogMessage("CDivergenceMonitor::ProcessEvents", LL_DEBUG, message);
                m_activeDivergences.Add(divergenceEvent);
            }
        }
    }
    // Wenn es ein Mitigation-Event ist, prüfen wir auf Auflösung von Divergenzen
    else if(event.getEventType() == EV_HIGH_LEVEL_MITIGATED || 
            event.getEventType() == EV_LOW_LEVEL_MITIGATED || 
            event.getEventType() == EV_HIGH_MITIGATED || 
            event.getEventType() == EV_LOW_MITIGATED)
    {
        // Prüfe Auflösungen basierend auf dem Symbol des Events
        if(eventSymbol == m_symbol || eventSymbol == m_correlatedSymbol)
        {
            CheckDivergenceResolution(event);
        }
    }
}

void CDivergenceMonitor::CheckDivergenceResolution(CEvent* mitigationEvent)
{
    string message;
    string mitigationSymbol = mitigationEvent.getSymbol();
    CArrayObj resolvedDivergences;
    
    for(int i = m_activeDivergences.Total() - 1; i >= 0; i--)
    {
        CDivergenceEvent* divergence = m_activeDivergences.At(i);
        if(divergence == NULL) continue;
        
        bool isResolved = false;
        
        // Fall 1: Das korrelierte Symbol erreicht sein Level (Auflösung einer normalen Divergenz)
        // Fall 2: Das Hauptsymbol erreicht sein Level (Auflösung einer inversen Divergenz)
        bool isCase1 = mitigationSymbol == m_correlatedSymbol && divergence.m_breakingPair == m_symbol;
        bool isCase2 = mitigationSymbol == m_symbol && divergence.m_breakingPair == m_correlatedSymbol;
        
        if(!isCase1 && !isCase2) continue;
        
        // Prüfe ob das mitigierte Level dem relevanten Level der Divergenz entspricht
        if(divergence.GetBrokenLevelType() == BROKEN_PRICE_LEVEL)
        {
            if(mitigationEvent.getEventType() == EV_HIGH_LEVEL_MITIGATED || 
               mitigationEvent.getEventType() == EV_LOW_LEVEL_MITIGATED)
            {
                CPriceLevelBrokenEvent* levelEvent = (CPriceLevelBrokenEvent*)mitigationEvent;
                if(levelEvent != NULL)
                {
                    CPriceLevel* mitigatedLevel = levelEvent.GetPriceLevel();
                    CPriceLevel* divergenceLevel = divergence.GetBrokenPriceLevel();
                    
                    // Prüfe ob es das gleiche Level ist
                    if(mitigatedLevel.GetType() == divergenceLevel.GetType() &&
                       mitigatedLevel.GetTime() == divergenceLevel.GetTime())
                    {
                        isResolved = true;
                        message = "Preislevel-Divergenz aufgelöst durch: " + mitigationEvent.toString();
                        message += " ("+mitigationSymbol+")";
                        CLogManager::GetInstance().LogMessage("CDivergenceMonitor::CheckDivergenceResolution", LL_DEBUG, message);
                    }
                }
            }
        }
        else // BROKEN_HIGH_LOW
        {
            if(mitigationEvent.getEventType() == EV_HIGH_MITIGATED || 
               mitigationEvent.getEventType() == EV_LOW_MITIGATED)
            {
                CHighLowBrokenEvent* hlEvent = (CHighLowBrokenEvent*)mitigationEvent;
                if(hlEvent != NULL)
                {
                    CHighLow* mitigatedHL = hlEvent.GetHighLow();
                    CHighLow* divergenceHL = divergence.GetBrokenHighLow();
                    
                    // Prüfe ob es das gleiche High/Low ist
                    if(mitigatedHL.isHigh() == divergenceHL.isHigh() &&
                       mitigatedHL.getSwingCandle().openTime == divergenceHL.getSwingCandle().openTime)
                    {
                        isResolved = true;
                        message = "High/Low-Divergenz aufgelöst durch: " + mitigationEvent.toString();
                        message += " ("+mitigationSymbol+")";
                        CLogManager::GetInstance().LogMessage("CDivergenceMonitor::CheckDivergenceResolution", LL_DEBUG, message);
                    }
                }
            }
        }
        
        if(isResolved)
        {
            // Erzeuge Auflösungs-Event
            ENUM_EVENT_TYPE resolutionType = (divergence.getEventType() == EV_BULLISH_DIVERGENCE_DETECTED) ? 
                EV_BULLISH_DIVERGENCE_RESOLVED : EV_BEARISH_DIVERGENCE_RESOLVED;
                
            CreateDivergenceResolutionEvent(divergence, resolutionType);
            
            // Markiere Divergenz zur Entfernung
            resolvedDivergences.Add(divergence);
        }
    }
    
    // Entferne aufgelöste Divergenzen
    for(int i = 0; i < m_activeDivergences.Total(); i++)
    {
        CDivergenceEvent* divergence = m_activeDivergences.At(i);
        for(int j = 0; j < resolvedDivergences.Total(); j++)
        {
            if(divergence == resolvedDivergences.At(j))
            {
                m_activeDivergences.Detach(i);
                i--; // Da wir ein Element entfernt haben, müssen wir den Index anpassen
                break;
            }
        }
    }
    
    while (resolvedDivergences.Total()>0)
       resolvedDivergences.Detach(0);
}

void CDivergenceMonitor::CreateDivergenceResolutionEvent(CDivergenceEvent* originalDivergence, ENUM_EVENT_TYPE resolutionType)
{
    if(originalDivergence.GetBrokenLevelType() == BROKEN_PRICE_LEVEL)
    {
        CDivergenceEvent* resolutionEvent = new CDivergenceEvent(
            m_symbol,
            resolutionType,
            originalDivergence.GetBrokenPriceLevel(),
            originalDivergence.GetDistanceNonBreakingAsset(),
            originalDivergence.GetOriginTimeframe(),
            originalDivergence.m_breakingPair,
            originalDivergence.m_nonBreakingPair,
            originalDivergence.m_correlatedClosePrice
        );
        
        CEventStore::GetInstance(m_symbol).AddEvent(resolutionEvent);
    }
    else
    {
        CDivergenceEvent* resolutionEvent = new CDivergenceEvent(
            m_symbol,
            resolutionType,
            originalDivergence.GetBrokenHighLow(),
            originalDivergence.GetDistanceNonBreakingAsset(),
            originalDivergence.GetOriginTimeframe(),
            originalDivergence.GetTargetTimeframe(),
            originalDivergence.m_breakingPair,
            originalDivergence.m_nonBreakingPair,
            originalDivergence.m_correlatedHighLowTime,
            originalDivergence.m_correlatedClosePrice
        );
        
        CEventStore::GetInstance(m_symbol).AddEvent(resolutionEvent);
    }
}

bool CDivergenceMonitor::HasActiveDivergence(ENUM_EVENT_TYPE divergenceType)
{
    for(int i = 0; i < m_activeDivergences.Total(); i++)
    {
        CDivergenceEvent* divergence = m_activeDivergences.At(i);
        if(divergence != NULL && divergence.getEventType() == divergenceType)
            return true;
    }
    return false;
}

// Implementation des IConditionProvider Interface
bool CDivergenceMonitor::ValidateCondition(const string& params[])
{
    if(ArraySize(params) < GetRequiredParameterCount())
        return false;
        
    string divergenceType = params[0];
    
    // Prüfe auf aktive Divergenzen des angegebenen Typs
    if(divergenceType == "BULLISH")
        return HasActiveDivergence(EV_BULLISH_DIVERGENCE_DETECTED);
    else if(divergenceType == "BEARISH")
        return HasActiveDivergence(EV_BEARISH_DIVERGENCE_DETECTED);
        
    return false;
}

string CDivergenceMonitor::GetConditionDetails(const string& params[])
{
    if(ArraySize(params) < GetRequiredParameterCount())
        return "Invalid parameters";
        
    string divergenceType = params[0];
    bool hasDivergence = HasActiveDivergence(
        divergenceType == "BULLISH" ? EV_BULLISH_DIVERGENCE_DETECTED : EV_BEARISH_DIVERGENCE_DETECTED
    );
    
    return StringFormat("Active %s divergence: %s", 
        divergenceType,
        hasDivergence ? "YES" : "NO"
    );
}

string CDivergenceMonitor::GetConditionDescription(const string& params[])
{
    if(ArraySize(params) < GetRequiredParameterCount())
        return "Invalid parameters";
        
    return StringFormat("%s divergence exists", params[0]);
}

int CDivergenceMonitor::GetRequiredParameterCount()
{
    return 1; // Nur Divergenz-Typ (BULLISH/BEARISH)
}

#endif // DIVERGENCE_MONITOR_MQH


