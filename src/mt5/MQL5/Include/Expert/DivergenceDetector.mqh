#ifndef DIVERGENCE_DETECTOR_MQH
#define DIVERGENCE_DETECTOR_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\Event.mqh>
#include <Expert\EventStore.mqh>
#include <Expert\PriceLevelBrokenEvent.mqh>
#include <Expert\HighLowBrokenEvent.mqh>
#include <Expert\DivergenceEvent.mqh>
#include <Expert\TechnicalAnalysisManager.mqh>
#include <Expert\PriceLevelManager.mqh>
#include <Expert\LogManager.mqh>
#include <Expert\Feature.mqh>

enum ENUM_DIVERGENCE_MODE {
    MODE_SWEEPS_ONLY, // nur Sweeps
    MODE_SWEEPS_AND_BREAKS // Sweeps oder Breaks (erstes Ereignis)
};

input group "Divergence Detection"
input bool InpUseKeyLevels = true;     // Schlüssel-Levels verwenden (Täglich, Wöchentlich, Monatlich)
input bool InpUseH1H4Levels = true;    // H1/H4 Kerzen-Levels verwenden
input bool InpUseSessionLevels = true; // Sitzungs-Levels verwenden
input bool InpUseHighsLows = true;     // Hochs/Tiefs verwenden
input int InpSwingTimeWindow = 1;      // Zeitfenster für Swing-Vergleich (in Kerzen)
input ENUM_DIVERGENCE_MODE InpHighLowDivergenceMode = MODE_SWEEPS_AND_BREAKS; // Divergenz-Erkennungsmodus für Hochs/Tiefs
input ENUM_DIVERGENCE_MODE InpLevelDivergenceMode = MODE_SWEEPS_AND_BREAKS; // Divergenz-Erkennungsmodus für Level

class CDivergenceDetector : public CFeature
{
private:
    int m_lastProcessedEventId;
    int m_lastProcessedCorrelatedEventId;
    CArrayObj* m_activeDivergences;

public:
    CDivergenceDetector();
    ~CDivergenceDetector();
    
    virtual void Update(CCandle* candle) override;
    virtual void ProcessEvents() override;
    virtual string GetName() override;
    virtual void GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredTimeframes(int& timeframes[]) override;
    virtual void Initialize() override;
    virtual void Deinitialize() override;

private:
    void ProcessSymbolEvents(string symbol, string otherSymbol, int& lastProcessedId);
    void CheckDivergence(CPriceLevelBrokenEvent* event, string symbol, const string otherSymbol);
    void CheckDivergenceResolution(CEvent* mitigationEvent);
    void CheckHighLowDivergence(CHighLowBrokenEvent* event, string symbol, const string otherSymbol);
    void CreateDivergenceEvent(CPriceLevelBrokenEvent* originalEvent, double correlatedClosePrice, int correlatedCloseDistance, string symbol, string otherSymbol);
    void CreateHighLowDivergenceEvent(CHighLowBrokenEvent* originalEvent, double correlatedClosePrice, int correlatedCloseDistance, datetime correlatedHighLowTime, string symbol, string otherSymbol);
    void CreateDivergenceResolutionEvent(CDivergenceEvent* originalDivergence, ENUM_EVENT_TYPE resolutionType);
};

CDivergenceDetector::CDivergenceDetector()
    : m_lastProcessedEventId(0), m_lastProcessedCorrelatedEventId(0)
{
   m_activeDivergences = new CArrayObj();
}

CDivergenceDetector::~CDivergenceDetector() 
{
   if(CheckPointer(m_activeDivergences) == POINTER_DYNAMIC) {
       while(m_activeDivergences.Total() > 0)
           m_activeDivergences.Detach(0);
       delete m_activeDivergences;
   }
}
    

string CDivergenceDetector::GetName() override {
   return "DivergenceDetector";
}

void CDivergenceDetector::GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 4);
   eventTypes[0] = EV_BULLISH_DIVERGENCE_DETECTED;
   eventTypes[1] = EV_BEARISH_DIVERGENCE_DETECTED;
   eventTypes[2] = EV_BULLISH_DIVERGENCE_RESOLVED;
   eventTypes[3] = EV_BEARISH_DIVERGENCE_RESOLVED;
}

void CDivergenceDetector::GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 4);
   eventTypes[0] = EV_HIGH_LEVEL_MITIGATED;
   eventTypes[1] = EV_LOW_LEVEL_MITIGATED;
   eventTypes[2] = EV_HIGH_MITIGATED;
   eventTypes[3] = EV_LOW_MITIGATED;
}

void CDivergenceDetector::GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 4);
   eventTypes[0] = EV_HIGH_LEVEL_MITIGATED;
   eventTypes[1] = EV_LOW_LEVEL_MITIGATED;
   eventTypes[2] = EV_HIGH_MITIGATED;
   eventTypes[3] = EV_LOW_MITIGATED;
}

void CDivergenceDetector::GetRequiredTimeframes(int& timeframes[]) override {
   ArrayResize(timeframes, 0);
}

void CDivergenceDetector::Initialize() override {
  // Initialisierung wird bereits im Konstruktor durchgeführt
}
  
void CDivergenceDetector::Deinitialize() override {
  // Cleanup wird bereits im Destruktor durchgeführt
}

void CDivergenceDetector::Update(CCandle* candle) override
{
}

void CDivergenceDetector::ProcessEvents() override
{
    // Verarbeite Events für das Hauptsymbol
    ProcessSymbolEvents(_Symbol, CEnvironmentManager::GetInstance().GetCorrelatedSymbol(_Symbol), m_lastProcessedEventId);

    // Verarbeite Events für das korrelierte Symbol
    ProcessSymbolEvents(CEnvironmentManager::GetInstance().GetCorrelatedSymbol(_Symbol), _Symbol, m_lastProcessedCorrelatedEventId);
}

void CDivergenceDetector::CheckDivergenceResolution(CEvent* mitigationEvent)
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
        bool isCase1 = mitigationSymbol == CEnvironmentManager::GetInstance().GetCorrelatedSymbol(_Symbol) && divergence.m_breakingPair == _Symbol;
        bool isCase2 = mitigationSymbol == _Symbol && divergence.m_breakingPair == CEnvironmentManager::GetInstance().GetCorrelatedSymbol(_Symbol);
        
        if(!isCase1 && !isCase2) continue;
        
        // Prüfe ob das mitigierte Level dem relevanten Level der Divergenz entspricht
        if(divergence.GetBrokenLevelType() == BROKEN_PRICE_LEVEL)
        {
            if(mitigationEvent.getEventType() == EV_HIGH_LEVEL_MITIGATED || 
               mitigationEvent.getEventType() == EV_LOW_LEVEL_MITIGATED)
            {
                CPriceLevelBrokenEvent* levelEvent = dynamic_cast<CPriceLevelBrokenEvent*>(mitigationEvent);
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
                        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergenceResolution", LL_DEBUG, message);
                    }
                }
            }
        }
        else // BROKEN_HIGH_LOW
        {
            if(mitigationEvent.getEventType() == EV_HIGH_MITIGATED || 
               mitigationEvent.getEventType() == EV_LOW_MITIGATED)
            {
                CHighLowBrokenEvent* hlEvent = dynamic_cast<CHighLowBrokenEvent*>(mitigationEvent);
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
                        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergenceResolution", LL_DEBUG, message);
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
    for(int i = 0; i < resolvedDivergences.Total(); i++) {
        CDivergenceEvent* resolvedDivergence = resolvedDivergences.At(i);
        for(int j = m_activeDivergences.Total() - 1; j >= 0; j--) {
            if(m_activeDivergences.At(j) == resolvedDivergence) {
                m_activeDivergences.Delete(j);
                break;
            }
        }
    }
    
    while(resolvedDivergences.Total() > 0)
        resolvedDivergences.Detach(0);
}

void CDivergenceDetector::ProcessSymbolEvents(string symbol, string otherSymbol, int& lastProcessedId)
{
    CEvent* newEvents[];
    int count = CEventStore::GetInstance(symbol).GetNewEvents(lastProcessedId, newEvents);

    for(int i = 0; i < count; i++)
    {
        CEvent* event = newEvents[i];
        
        // Divergenzen speichern
        if(event.getEventType() == EV_BULLISH_DIVERGENCE_DETECTED || 
           event.getEventType() == EV_BEARISH_DIVERGENCE_DETECTED)
        {
            if(event.getSymbol() == _Symbol)
            {
                CDivergenceEvent* divergenceEvent = dynamic_cast<CDivergenceEvent*>(event);
                if(divergenceEvent != NULL) {
                    m_activeDivergences.Add(divergenceEvent);
                }
            }
        }
        // Original Event-Verarbeitung
        else if(InpUseKeyLevels || InpUseSessionLevels)
        {
            bool relevantEvent = false;

            if (InpLevelDivergenceMode == MODE_SWEEPS_ONLY)
               relevantEvent = (event.getEventType() == EV_HIGH_LEVEL_SWEPT || event.getEventType() == EV_LOW_LEVEL_SWEPT);
            else if (InpLevelDivergenceMode == MODE_SWEEPS_AND_BREAKS)
               relevantEvent = (event.getEventType() == EV_HIGH_LEVEL_MITIGATED || event.getEventType() == EV_LOW_LEVEL_MITIGATED);          

            if(relevantEvent)
            {
                CPriceLevelBrokenEvent* levelEvent = dynamic_cast<CPriceLevelBrokenEvent*>(event);
                if(levelEvent != NULL)
                {
                    CPriceLevel* level = levelEvent.GetPriceLevel();
                    ENUM_LEVEL_TYPE levelType = level.GetType();

                    if((InpUseKeyLevels && (levelType == LEVEL_DAILY || levelType == LEVEL_WEEKLY || levelType == LEVEL_MONTHLY)) ||
                       (InpUseSessionLevels && levelType == LEVEL_SESSION) ||
                       (InpUseH1H4Levels && (levelType == LEVEL_H1 || levelType == LEVEL_H4)))
                    {
                        CheckDivergence(levelEvent, symbol, otherSymbol);
                    }
                }
            }
        }

        if(InpUseHighsLows)
        {
            bool relevantEvent = false;

            if (InpHighLowDivergenceMode == MODE_SWEEPS_ONLY)
               relevantEvent = (event.getEventType() == EV_HIGH_SWEPT || event.getEventType() == EV_LOW_SWEPT);
            else
               relevantEvent = (event.getEventType() == EV_HIGH_MITIGATED || event.getEventType() == EV_LOW_MITIGATED);

            if(relevantEvent)
            {
                CHighLowBrokenEvent* hlEvent = dynamic_cast<CHighLowBrokenEvent*>(event);
                if(hlEvent != NULL)
                {
                    CheckHighLowDivergence(hlEvent, symbol, otherSymbol);
                }
            }
        }
        
        // Prüfe auf Auflösung von Divergenzen
        if(event.getEventType() == EV_HIGH_LEVEL_MITIGATED || 
           event.getEventType() == EV_LOW_LEVEL_MITIGATED || 
           event.getEventType() == EV_HIGH_MITIGATED || 
           event.getEventType() == EV_LOW_MITIGATED)
        {
            CheckDivergenceResolution(event);
        }

        lastProcessedId = event.id;
    }
}

void CDivergenceDetector::CreateDivergenceResolutionEvent(CDivergenceEvent* originalDivergence, ENUM_EVENT_TYPE resolutionType)
{
    if(originalDivergence.GetBrokenLevelType() == BROKEN_PRICE_LEVEL)
    {
        CDivergenceEvent* resolutionEvent = new CDivergenceEvent(
            _Symbol,
            resolutionType,
            originalDivergence.GetBrokenPriceLevel(),
            originalDivergence.GetDistanceNonBreakingAsset(),
            originalDivergence.GetOriginTimeframe(),
            originalDivergence.m_breakingPair,
            originalDivergence.m_nonBreakingPair,
            originalDivergence.m_correlatedClosePrice
        );
        
        CEventStore::GetInstance(_Symbol).AddEvent(resolutionEvent);
    }
    else
    {
        CDivergenceEvent* resolutionEvent = new CDivergenceEvent(
            _Symbol,
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
        
        CEventStore::GetInstance(_Symbol).AddEvent(resolutionEvent);
    }
}

void CDivergenceDetector::CheckDivergence(CPriceLevelBrokenEvent* event, string symbol, const string otherSymbol)
{
    CPriceLevel* brokenLevel = event.GetPriceLevel();
    ENUM_EVENT_TYPE eventType = event.getEventType();
    bool isHighLevel = StringFind(event.GetEventName(),"HIGH")>-1;
    string message;

    message = symbol+"."+CChartHelper::GetTimeframeName(event.GetBreakerCandle().timeframe)+": Durchbrochener Level: "+ brokenLevel.toString();
    CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergence",LL_DEBUG,message);

    message = "Relevantes Event: "+ event.toString();
    CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergence",LL_DEBUG,message);

    // Hole den Price Level Manager für das korrelierte Symbol
    CPriceLevelManager* correlatedLevelManager = (CPriceLevelManager*)CEnvironmentManager::GetInstance().GetFeatureForSymbol(otherSymbol,"PriceLevelManager");

    if (correlatedLevelManager == NULL)
    {
        message = "Fehler: Konnte Price Level Manager für Symbol "+ otherSymbol +" nicht abrufen";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergence",LL_ERROR,message);
        return;
    }

    // Hole die aktuelle Kerze des korrelierten Symbols
    CBaseChart* correlatedChart = CChartManager::GetInstance().GetChart(otherSymbol, event.GetBreakerCandle().timeframe);
    if (correlatedChart == NULL)
    {
        message = "Fehler: Konnte korrelierten Chart für Symbol "+ otherSymbol +" nicht abrufen";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergence",LL_ERROR,message);
        return;
    }

    CCandle* currentCorrelatedCandle = correlatedChart.getCandleAt(0);

    if (currentCorrelatedCandle == NULL)
    {
        message = "Fehler: Keine aktuelle Kerze für das korrelierte Symbol gefunden";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergence",LL_ERROR,message);
        return;
    }

    double correlatedClosePrice = currentCorrelatedCandle.close;
    message = "Korrelierter Schlusskurs: "+ DoubleToString(correlatedClosePrice);
    //CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergence",LL_DEBUG,message);

    // Finde das entsprechende Level im korrelierten Symbol
    CPriceLevel* correlatedLevel = correlatedLevelManager.FindCorrespondingLevel(brokenLevel);
    
    message = "Suche nach korreliertem Level";
    //CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergence",LL_DEBUG,message);
    if (correlatedLevel == NULL)
    {
       message = "Kein entsprechendes Level im korrelierten Symbol gefunden";
       CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergence",LL_DEBUG,message);
       return;
    } 
    else
    {    
       message = "Korreliertes Level gefunden bei "+ DoubleToString(correlatedLevel.GetPrice()) +". Details: "+correlatedLevel.toString();
       CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergence",LL_DEBUG,message);
       if (correlatedLevel.GetMitigatedStatus(PERIOD_M1))
       {
          message = "Korreliertes Level bereits berührt";
          CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergence",LL_DEBUG,message);
          return;
       }
    }
    
    if (isHighLevel)
    {
        message = symbol+"."+CChartHelper::GetTimeframeName(event.GetBreakerCandle().timeframe)+": Divergenz an Hoch-Level erkannt";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergence",LL_DEBUG,message);
    }
    else 
    {        
        message = symbol+"."+CChartHelper::GetTimeframeName(event.GetBreakerCandle().timeframe)+": Divergenz an Tief-Level erkannt";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergence",LL_DEBUG,message);
    }
    
    // Berechne den Abstand zwischen dem Schlusskurs des korrelierten Symbols und dem korrelierten Level
    int correlatedCloseDistance = (int)MathAbs(correlatedClosePrice - correlatedLevel.GetPrice())/_Point;
    message = "Abstand zum korrelierten Level: "+ IntegerToString(correlatedCloseDistance);
    //CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckDivergence",LL_DEBUG,message);

    // Divergenz erkannt
    CreateDivergenceEvent(event, correlatedClosePrice, correlatedCloseDistance, symbol, otherSymbol);   
}

void CDivergenceDetector::CheckHighLowDivergence(CHighLowBrokenEvent* event, string symbol, const string otherSymbol)
{
    CHighLow* brokenHL = event.GetHighLow();
    ENUM_EVENT_TYPE eventType = event.getEventType();
    bool isHigh = StringFind(event.GetEventName(),"HIGH")>-1;
    string message;

    message = "Durchbrochenes HighLow: "+ brokenHL.toString() +" Typ: "+ event.GetEventName() +" IsHigh: "+ IntegerToString(isHigh);
    CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckHighLowDivergence",LL_DEBUG,message);

    // Hole den High Low Detector für das korrelierte Symbol
    CHighLowDetector* correlatedDetector = (CHighLowDetector*)CEnvironmentManager::GetInstance().GetFeatureForSymbol(otherSymbol,"HighLowDetector");

    if (correlatedDetector == NULL)
    {
        message = "Fehler: Konnte korrelierten High Low Detector für Symbol "+ otherSymbol +" nicht abrufen";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckHighLowDivergence",LL_ERROR,message);
        return;
    }

    // Hole die aktuelle Kerze des korrelierten Symbols
    CBaseChart* correlatedChart = CChartManager::GetInstance().GetChart(otherSymbol, event.GetBreakerCandle().timeframe);
    if (correlatedChart == NULL)
    {
        message = "Fehler: Konnte korrelierten Chart für Symbol "+ otherSymbol +" nicht abrufen";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckHighLowDivergence",LL_ERROR,message);
        return;
    }

    CCandle* currentCorrelatedCandle = correlatedChart.getCandleAt(0);

    if (currentCorrelatedCandle == NULL)
    {
        message = "Fehler: Keine aktuelle Kerze für das korrelierte Symbol gefunden";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckHighLowDivergence",LL_ERROR,message);
        return;
    }

    // Finde das entsprechende High/Low im korrelierten Symbol (mit Kerzenfenster)
    CHighLow* correlatedHL = correlatedDetector.FindCorrespondingHighLow(brokenHL, InpSwingTimeWindow);
    
    if (correlatedHL == NULL)
    {
        // Fallback: Suche nach dem nächsten High/Low in der Nähe (falls keine exakte Übereinstimmung)
        if (isHigh)
            correlatedHL = correlatedDetector.GetNextHigherHigh(currentCorrelatedCandle, brokenHL.getSwingCandle().timeframe);
        else
            correlatedHL = correlatedDetector.GetNextLowerLow(currentCorrelatedCandle, brokenHL.getSwingCandle().timeframe);
            
        message = "Kein exaktes High/Low gefunden, Fallback auf price-proximity Suche";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckHighLowDivergence",LL_DEBUG,message);
    }

    if (correlatedHL == NULL)
    {
        message = "Kein entsprechendes High/Low im korrelierten Symbol gefunden";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckHighLowDivergence",LL_DEBUG,message);
        return;
    }

    message = "Korreliertes HighLow gefunden: "+ correlatedHL.toString();
    CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckHighLowDivergence",LL_DEBUG,message);

    // Prüfe, ob das korrelierte High/Low innerhalb des akzeptablen Zeitbereichs liegt
    datetime startTime = brokenHL.getSwingCandle().openTime - CChartHelper::GetPeriodMinutes(brokenHL.getSwingCandle().timeframe)*60;
    datetime endTime = brokenHL.getSwingCandle().openTime + CChartHelper::GetPeriodMinutes(brokenHL.getSwingCandle().timeframe)*60;

    if (correlatedHL.getSwingCandle().openTime < startTime || correlatedHL.getSwingCandle().openTime > endTime)
    {
        message = "Korreliertes HighLow liegt außerhalb des akzeptablen Zeitbereichs";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckHighLowDivergence",LL_DEBUG,message);
        return;
    }

    // Prüfe, ob eine Divergenz vorliegt
    bool isDivergence = false;
    if (isHigh && currentCorrelatedCandle.high < correlatedHL.getSwingCandle().high)
    {
        isDivergence = true;
        message = "Divergenz an Hoch erkannt";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckHighLowDivergence",LL_DEBUG,message);
    }
    else if (!isHigh && currentCorrelatedCandle.low > correlatedHL.getSwingCandle().low)
    {
        isDivergence = true;
        message = "Divergenz an Tief erkannt";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckHighLowDivergence",LL_DEBUG,message);
    }
    else
    {
        message = "Keine Divergenz erkannt";
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckHighLowDivergence",LL_DEBUG,message);
    }

    if (isDivergence)
    {
        // Berechne den Abstand zwischen dem High/Low des korrelierten Symbols und dem ursprünglichen High/Low
        int correlatedDistance = (int)MathAbs(currentCorrelatedCandle.close - correlatedHL.GetTreeValue()) / _Point;
        message = "Abstand zum korrelierten HighLow: "+ IntegerToString(correlatedDistance);
        CLogManager::GetInstance().LogMessage("CDivergenceDetector::CheckHighLowDivergence",LL_DEBUG,message);

        // Divergenz erkannt
        CreateHighLowDivergenceEvent(event, currentCorrelatedCandle.close, correlatedDistance, correlatedHL.getSwingCandle().openTime, symbol, otherSymbol);
    }
}

void CDivergenceDetector::CreateDivergenceEvent(CPriceLevelBrokenEvent* originalEvent, double correlatedClosePrice, int correlatedCloseDistance, string symbol, string otherSymbol)
{
    bool isHigh = StringFind(originalEvent.GetEventName(),"HIGH")>-1;
    ENUM_EVENT_TYPE eventType = isHigh? EV_BEARISH_DIVERGENCE_DETECTED : EV_BULLISH_DIVERGENCE_DETECTED;

    CDivergenceEvent* divergenceEvent = new CDivergenceEvent(
        _Symbol,
        eventType,
        originalEvent.GetPriceLevel(),
        correlatedCloseDistance,
        originalEvent.GetBreakerCandle().timeframe,
        symbol,  // durchbrechendes Paar
        CEnvironmentManager::GetInstance().GetCorrelatedSymbol(_Symbol),  // nicht-durchbrechendes Paar
        correlatedClosePrice
    );

    CEventStore::GetInstance(_Symbol).AddEvent(divergenceEvent);
}

void CDivergenceDetector::CreateHighLowDivergenceEvent(CHighLowBrokenEvent* originalEvent, double correlatedClosePrice, int correlatedDistance, datetime correlatedHighLowTime, string symbol, string otherSymbol)
{
    bool isHigh = StringFind(originalEvent.GetEventName(),"HIGH")>-1;
    ENUM_EVENT_TYPE eventType = isHigh? EV_BEARISH_DIVERGENCE_DETECTED : EV_BULLISH_DIVERGENCE_DETECTED;

    CDivergenceEvent* divergenceEvent = new CDivergenceEvent(
        _Symbol,
        eventType,
        originalEvent.GetHighLow(),
        correlatedDistance,
        originalEvent.GetBreakerCandle().timeframe,
        originalEvent.GetTargetTimeframe(),
        symbol,  // durchbrechendes Paar
        otherSymbol,  // nicht-durchbrechendes Paar
        correlatedHighLowTime,
        correlatedClosePrice
    );

    CEventStore::GetInstance(_Symbol).AddEvent(divergenceEvent);
}

#endif // DIVERGENCE_DETECTOR_MQH


