//+------------------------------------------------------------------+
//|                                    SupportResistanceDetector.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef SUPPORT_RESISTANCE_DETECTOR_MQH
#define SUPPORT_RESISTANCE_DETECTOR_MQH

#include <Expert\SupportResistanceArea.mqh>
#include <Expert\SupportResistanceAreaCreatedEvent.mqh>
#include <Expert\SupportResistanceAreaEvent.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Imbalance.mqh>
#include <Expert\Feature.mqh>
#include <Expert\EventStore.mqh>
#include <Expert\LogManager.mqh>
#include <Arrays\ArrayObj.mqh>

input group "Support/Resistance Areas"
input bool sr_areas_enabled = true; /* Support/Resistance Areas aktivieren */
input bool sr_create_from_imbalance_candles = true; /* Areas aus Imbalance-Kerzen erstellen */

// CSRAreaTimeframeData Class Definition  
class CSupportResistanceAreaTimeframeData : public CObject
{
public:
    CArrayObj* upperAreaTree;     // Areas oberhalb Marktpreis (potential Resistance)
    CArrayObj* lowerAreaTree;     // Areas unterhalb Marktpreis (potential Support)
    CArrayObj* inactiveAreas;   // Deaktivierte Areas
    int timeframe;

    CSupportResistanceAreaTimeframeData(int tf);
    ~CSupportResistanceAreaTimeframeData();
};

// CSupportResistanceDetector Class Definition
class CSupportResistanceDetector : public CFeature
{
private:
    static CSupportResistanceDetector* s_instance;
    CArrayObj* timeframeDataArray;
    int timeframes[];
    
    CSupportResistanceAreaTimeframeData* GetOrCreateTimeframeData(int timeframe);
    CSupportResistanceAreaTimeframeData* GetTimeframeData(int timeframe);
    CArrayObj* FindAffectedAreas(CCandle* candle, CSupportResistanceAreaTimeframeData* data);
    void UpdateAreaState(CSupportResistanceArea* area, CCandle* current);
    void DeactivateArea(CSupportResistanceArea* area, CSupportResistanceAreaTimeframeData* data);
    void ProcessAreaTest(CSupportResistanceArea* area, CCandle* candle);
    void ProcessAreaBreakthrough(CSupportResistanceArea* area, CCandle* candle);

public:
    CSupportResistanceDetector();
    ~CSupportResistanceDetector();
    
    static CSupportResistanceDetector* GetInstance();
    
    // Feature Interface
    virtual void Update(CCandle* candle) override;
    virtual void ProcessEvents() override;
    virtual string GetName() override { return "SupportResistanceDetector"; }
    virtual void GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredTimeframes(int& timeframes[]) override;
    virtual void Initialize() override;
    virtual void Deinitialize() override;
    
    // Area Management
    CSupportResistanceArea* CreateFromImbalanceCandle(CImbalance* imbalance);
    void AddArea(CSupportResistanceArea* area);
    CArrayObj* GetAreasForTimeframe(int timeframe);
    CArrayObj* GetInactiveAreasForTimeframe(int timeframe);
    
    // Event Handlers
    void OnImbalanceCreated(CImbalanceCreatedEvent* event);
};

// Static instance
CSupportResistanceDetector* CSupportResistanceDetector::s_instance = NULL;

// CSupportResistanceAreaTimeframeData Implementation
CSupportResistanceAreaTimeframeData::CSupportResistanceAreaTimeframeData(int tf) : timeframe(tf)
{
    upperAreaTree = new CArrayObj();
    lowerAreaTree = new CArrayObj();  
    inactiveAreas = new CArrayObj();
}

CSupportResistanceAreaTimeframeData::~CSupportResistanceAreaTimeframeData()
{
    if(CheckPointer(upperAreaTree) == POINTER_DYNAMIC)
        delete upperAreaTree;
    if(CheckPointer(lowerAreaTree) == POINTER_DYNAMIC)
        delete lowerAreaTree;
    if(CheckPointer(inactiveAreas) == POINTER_DYNAMIC)
        delete inactiveAreas;
}

// CSupportResistanceDetector Implementation
CSupportResistanceDetector::CSupportResistanceDetector()
{
    timeframeDataArray = new CArrayObj();
}

CSupportResistanceDetector::~CSupportResistanceDetector()
{
    if(CheckPointer(timeframeDataArray) == POINTER_DYNAMIC)
        delete timeframeDataArray;
}

CSupportResistanceDetector* CSupportResistanceDetector::GetInstance()
{
    if(s_instance == NULL) {
        s_instance = new CSupportResistanceDetector();
    }
    return s_instance;
}

void CSupportResistanceDetector::Initialize()
{
    // Setup timeframes - analog zu ImbalanceDetector
    ArrayResize(timeframes, 7);
    timeframes[0] = PERIOD_M1;
    timeframes[1] = PERIOD_M5;
    timeframes[2] = PERIOD_M15;
    timeframes[3] = PERIOD_M30;
    timeframes[4] = PERIOD_H1;
    timeframes[5] = PERIOD_H4;
    timeframes[6] = PERIOD_D1;
}

void CSupportResistanceDetector::Deinitialize()
{
    if(CheckPointer(timeframeDataArray) == POINTER_DYNAMIC)
        delete timeframeDataArray;
    timeframeDataArray = NULL;
}

CSupportResistanceAreaTimeframeData* CSupportResistanceDetector::GetOrCreateTimeframeData(int timeframe)
{
    // Suche existierende Daten
    for(int i = 0; i < timeframeDataArray.Total(); i++) {
        CSupportResistanceAreaTimeframeData* data = timeframeDataArray.At(i);
        if(data.timeframe == timeframe) {
            return data;
        }
    }
    
    // Erstelle neue Daten
    CSupportResistanceAreaTimeframeData* newData = new CSupportResistanceAreaTimeframeData(timeframe);
    timeframeDataArray.Add(newData);
    return newData;
}

CSupportResistanceAreaTimeframeData* CSupportResistanceDetector::GetTimeframeData(int timeframe)
{
    for(int i = 0; i < timeframeDataArray.Total(); i++) {
        CSupportResistanceAreaTimeframeData* data = timeframeDataArray.At(i);
        if(data.timeframe == timeframe) {
            return data;
        }
    }
    return NULL;
}

CSupportResistanceArea* CSupportResistanceDetector::CreateFromImbalanceCandle(CImbalance* imbalance)
{
    if(imbalance == NULL || imbalance.associatedCandle == NULL) {
        return NULL;
    }
    
    CCandle* candle = imbalance.associatedCandle;
    
    // Korrekte Top/Bottom Bestimmung basierend auf Kerzen-Richtung
    double upperBound, lowerBound;
    
    if(candle.close >= candle.open) {
        // Bullish/Green Candle: close = top, open = bottom
        upperBound = candle.close;
        lowerBound = candle.open;
    } else {
        // Bearish/Red Candle: open = top, close = bottom
        upperBound = candle.open;
        lowerBound = candle.close;
    }
    
    string sourceId = StringFormat("IMB_CANDLE_%d", imbalance.GetUniqueId());
    
    CSupportResistanceArea* area = new CSupportResistanceArea(
        upperBound, 
        lowerBound, 
        imbalance.timeframe,
        AREA_SOURCE_IMBALANCE_CANDLE_BODY,
        sourceId,
        candle
    );
    
    return area;
}

void CSupportResistanceDetector::AddArea(CSupportResistanceArea* area)
{
    if(area == NULL) return;
    
    CSupportResistanceAreaTimeframeData* data = GetOrCreateTimeframeData(area.originTimeframe);
    if(data == NULL) return;
    
    // Bestimme in welchen Baum die Area gehört (basierend auf aktueller Marktposition)
    // Vereinfacht: Areas gehen initial in lowerTree (werden als potential Support betrachtet)
    data.lowerAreaTree.Add(area);
    
    CLogManager::GetInstance().LogMessage(GetName(), LL_DEBUG, "Added area: " + area.ToString());
    
    // Erzeuge CSupportResistanceAreaCreatedEvent
    CSupportResistanceAreaCreatedEvent* createdEvent = new CSupportResistanceAreaCreatedEvent(_Symbol, area);
    CEventStore::GetInstance(_Symbol).AddEvent(createdEvent);
}

void CSupportResistanceDetector::Update(CCandle* candle)
{
    if(!sr_areas_enabled || candle == NULL) return;
    
    // Analog zu ImbalanceDetector: Teste Areas auf Timeframes >= candle.timeframe
    for(int i = 0; i < ArraySize(timeframes); i++) {
        CSupportResistanceAreaTimeframeData* tfData = GetTimeframeData(timeframes[i]);
        if(tfData != NULL && timeframes[i] >= candle.timeframe) {
            CArrayObj* affectedAreas = FindAffectedAreas(candle, tfData);
            
            if(affectedAreas != NULL) {
                for(int j = 0; j < affectedAreas.Total(); j++) {
                    CSupportResistanceArea* area = affectedAreas.At(j);
                    UpdateAreaState(area, candle);
                }
                delete affectedAreas;
            }
        }
    }
}

CArrayObj* CSupportResistanceDetector::FindAffectedAreas(CCandle* candle, CSupportResistanceAreaTimeframeData* data)
{
    CArrayObj* affectedAreas = new CArrayObj();
    
    // Suche in beiden Bäumen nach Areas die von der Kerze betroffen sind
    // Vereinfacht: durchlaufe alle Areas und prüfe Overlap
    CArrayObj* upperAreas = new CArrayObj();
    CArrayObj* lowerAreas = new CArrayObj();
    
    for(int i = 0; i < data.upperAreaTree.Total(); i++) {
        CSupportResistanceArea* area = data.upperAreaTree.At(i);
        if(area != NULL && area.IsInArea(candle.low) || area.IsInArea(candle.high) || 
           (candle.low <= area.lowerBound && candle.high >= area.upperBound)) {
            upperAreas.Add(area);
        }
    }
    
    for(int i = 0; i < data.lowerAreaTree.Total(); i++) {
        CSupportResistanceArea* area = data.lowerAreaTree.At(i);
        if(area != NULL && (area.IsInArea(candle.low) || area.IsInArea(candle.high) || 
           (candle.low <= area.lowerBound && candle.high >= area.upperBound))) {
            lowerAreas.Add(area);
        }
    }
    
    if(upperAreas != NULL) {
        for(int i = 0; i < upperAreas.Total(); i++) {
            affectedAreas.Add(upperAreas.At(i));
        }
        delete upperAreas;
    }
    
    if(lowerAreas != NULL) {
        for(int i = 0; i < lowerAreas.Total(); i++) {
            affectedAreas.Add(lowerAreas.At(i));
        }
        delete lowerAreas;
    }
    
    return affectedAreas;
}

void CSupportResistanceDetector::UpdateAreaState(CSupportResistanceArea* area, CCandle* current)
{
    // Test-Erkennung
    bool hasTestedArea = false;
    bool comingFromAbove = (current.open > area.upperBound && current.low <= area.upperBound);
    bool comingFromBelow = (current.open < area.lowerBound && current.high >= area.lowerBound);
    
    if(comingFromAbove || comingFromBelow) {
        hasTestedArea = true;
        ProcessAreaTest(area, current);
    }
    
    // Durchbruch-Erkennung nur auf Origin-Timeframe
    if(current.timeframe == area.originTimeframe) {
        bool breakthroughAbove = (current.close > area.upperBound);
        bool breakthroughBelow = (current.close < area.lowerBound);
        
        if(breakthroughAbove || breakthroughBelow) {
            ProcessAreaBreakthrough(area, current);
        }
    }
}

void CSupportResistanceDetector::ProcessAreaTest(CSupportResistanceArea* area, CCandle* candle)
{
    bool comingFromAbove = (candle.open > area.upperBound && candle.low <= area.upperBound);
    bool comingFromBelow = (candle.open < area.lowerBound && candle.high >= area.lowerBound);
    
    if(comingFromAbove) {
        // Test von oben ? Area agiert als Support
        area.AddSupportTest(candle.timeframe, candle.closeTime, candle.low);
        CLogManager::GetInstance().LogMessage(GetName(), LL_DEBUG, 
            StringFormat("Support test for area %d by %s", area.GetUniqueId(), EnumToString((ENUM_TIMEFRAMES)candle.timeframe)));
        
        // Erzeuge EV_SRAREA_TESTED_SUPPORT Event
        string details = StringFormat("Tested as Support at %.5f by %s", candle.low, EnumToString((ENUM_TIMEFRAMES)candle.timeframe));
        CSupportResistanceAreaEvent* testEvent = new CSupportResistanceAreaEvent(EV_SRAREA_TESTED_SUPPORT, _Symbol, area, candle, details);
        CEventStore::GetInstance(_Symbol).AddEvent(testEvent);
        
    } else if(comingFromBelow) {
        // Test von unten ? Area agiert als Resistance  
        area.AddResistanceTest(candle.timeframe, candle.closeTime, candle.high);
        CLogManager::GetInstance().LogMessage(GetName(), LL_DEBUG, 
            StringFormat("Resistance test for area %d by %s", area.GetUniqueId(), EnumToString((ENUM_TIMEFRAMES)candle.timeframe)));
        
        // Erzeuge EV_SRAREA_TESTED_RESISTANCE Event
        string details = StringFormat("Tested as Resistance at %.5f by %s", candle.high, EnumToString((ENUM_TIMEFRAMES)candle.timeframe));
        CSupportResistanceAreaEvent* testEvent = new CSupportResistanceAreaEvent(EV_SRAREA_TESTED_RESISTANCE, _Symbol, area, candle, details);
        CEventStore::GetInstance(_Symbol).AddEvent(testEvent);
    }
}

void CSupportResistanceDetector::ProcessAreaBreakthrough(CSupportResistanceArea* area, CCandle* candle)
{
    ENUM_ZONE_CHARACTER newCharacter = area.character;
    
    if(candle.close > area.upperBound) {
        // Durchbruch nach oben
        if(area.character == ZONE_RESISTANCE || area.character == ZONE_NEUTRAL) {
            newCharacter = ZONE_SUPPORT;  // Resistance wird zu Support
        }
    } else if(candle.close < area.lowerBound) {
        // Durchbruch nach unten
        if(area.character == ZONE_SUPPORT || area.character == ZONE_NEUTRAL) {
            newCharacter = ZONE_RESISTANCE;  // Support wird zu Resistance
        }
    }
    
    if(newCharacter != area.character) {
        ENUM_ZONE_CHARACTER oldCharacter = area.character;
        area.ProcessBreakthrough(newCharacter);
        
        CLogManager::GetInstance().LogMessage(GetName(), LL_DEBUG, 
            StringFormat("Area %d breakthrough - character flip: %s -> %s", 
                        area.GetUniqueId(), EnumToString(oldCharacter), EnumToString(newCharacter)));
        
        // Erzeuge EV_SRAREA_CHARACTER_FLIP Event
        string details = StringFormat("Character flip: %s -> %s", EnumToString(oldCharacter), EnumToString(newCharacter));
        CSupportResistanceAreaEvent* flipEvent = new CSupportResistanceAreaEvent(EV_SRAREA_CHARACTER_FLIP, _Symbol, area, candle, details);
        CEventStore::GetInstance(_Symbol).AddEvent(flipEvent);
    }
}

void CSupportResistanceDetector::ProcessEvents()
{
    if(!sr_areas_enabled) return;
    
    // Verarbeite neue Events
    CEvent* eventArray[];
    CEventStore::GetInstance(_Symbol).GetNewEvents(0, eventArray);
    
    for(int i = 0; i < ArraySize(eventArray); i++) {
        CEvent* event = eventArray[i];
        if(event != NULL && event.getEventType() == EV_IMBALANCE_CREATED) {
            CImbalanceCreatedEvent* imbalanceEvent = dynamic_cast<CImbalanceCreatedEvent*>(event);
            if(imbalanceEvent != NULL) {
                OnImbalanceCreated(imbalanceEvent);
            }
        }
    }
}

void CSupportResistanceDetector::GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[])
{
    ArrayResize(eventTypes, 6);
    eventTypes[0] = EV_SRAREA_CREATED;
    eventTypes[1] = EV_SRAREA_TESTED_SUPPORT;
    eventTypes[2] = EV_SRAREA_TESTED_RESISTANCE;
    eventTypes[3] = EV_SRAREA_CHARACTER_FLIP;
    eventTypes[4] = EV_SRAREA_QUALITY_UPGRADE;
    eventTypes[5] = EV_SRAREA_QUALITY_DOWNGRADE;
}

void CSupportResistanceDetector::GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[])
{
    ArrayResize(eventTypes, 1);
    eventTypes[0] = EV_IMBALANCE_CREATED;  // Benötigt Imbalance-Events um Areas zu erstellen
}

void CSupportResistanceDetector::GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[])
{
    ArrayResize(eventTypes, 0);  
}

void CSupportResistanceDetector::GetRequiredTimeframes(int& requiredTimeframes[])
{
    ArrayResize(requiredTimeframes, 0);
}


CArrayObj* CSupportResistanceDetector::GetAreasForTimeframe(int timeframe)
{
    CSupportResistanceAreaTimeframeData* data = GetTimeframeData(timeframe);
    if(data == NULL) return NULL;
    
    CArrayObj* allAreas = new CArrayObj();
    
    // Sammle Areas aus beiden Bäumen
    for(int i = 0; i < data.upperAreaTree.Total(); i++) {
        CSupportResistanceArea* area = data.upperAreaTree.At(i);
        if(area != NULL) allAreas.Add(area);
    }
    
    for(int i = 0; i < data.lowerAreaTree.Total(); i++) {
        CSupportResistanceArea* area = data.lowerAreaTree.At(i);
        if(area != NULL) allAreas.Add(area);
    }
    
    return allAreas;
}

CArrayObj* CSupportResistanceDetector::GetInactiveAreasForTimeframe(int timeframe)
{
    CSupportResistanceAreaTimeframeData* data = GetTimeframeData(timeframe);
    return data != NULL ? data.inactiveAreas : NULL;
}

void CSupportResistanceDetector::OnImbalanceCreated(CImbalanceCreatedEvent* event)
{
    if(!sr_create_from_imbalance_candles || event == NULL) return;
    
    CImbalance* imbalance = event.GetImbalance();
    if(imbalance == NULL) return;
    
    CSupportResistanceArea* area = CreateFromImbalanceCandle(imbalance);
    if(area != NULL) {
        AddArea(area);
    }
}

#endif // SUPPORT_RESISTANCE_DETECTOR_MQH

