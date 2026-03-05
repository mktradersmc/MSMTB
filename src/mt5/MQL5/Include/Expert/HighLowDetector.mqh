//+------------------------------------------------------------------+
//|                                              HighLowDetector.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef HIGHLOW_DETECTOR_MQH
#define HIGHLOW_DETECTOR_MQH

#include <Expert\Candle.mqh>
#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Arrays/ArrayString.mqh>
#include <Expert\Event.mqh>
#include <Expert\HighLowBrokenEvent.mqh>
#include <Expert\HighLowCreatedEvent.mqh>
#include <Expert\EventStore.mqh>
#include <Expert\HighLow.mqh>
#include <Expert\RBTree.mqh>
#include <Expert\ChartManager.mqh>
#include <Expert\BaseChart.mqh>
#include <Expert\Feature.mqh>

input bool ShowHighLows = false; // Zeichnen der strukturellen Highs und Lows

class CBaseChart;
class CChartManager;

// CHighLowTimeframeData Class Definition
class CHighLowTimeframeData : public CObject {
public:
    CRBTree* highTree;
    CRBTree* lowTree;
    CArrayObj* activeHighs;
    CArrayObj* activeLows;
    CArrayObj* inactiveHighs;
    CArrayObj* inactiveLows;
    
    // Tracking der letzten Extrempunkte
    CHighLow* lastHighestHigh;    // Letztes höchstes High seit letztem Break
    CHighLow* lastLowestLow;      // Letztes tiefstes Low seit letztem Break
    CHighLow* lastStructuralHigh; // Letzter struktureller High-Point
    CHighLow* lastStructuralLow;  // Letzter struktureller Low-Point
    
    // Initialisierungsstatus für beide Richtungen
    bool isStructuralHighInitialized;
    bool isStructuralLowInitialized;

    CHighLowTimeframeData() {
        highTree = new CRBTree("highlows_high");
        lowTree = new CRBTree("highlows_low");
        activeHighs = new CArrayObj();
        activeLows = new CArrayObj();
        inactiveHighs = new CArrayObj();
        inactiveLows = new CArrayObj();
        
        lastHighestHigh = NULL;
        lastLowestLow = NULL;
        lastStructuralHigh = NULL;
        lastStructuralLow = NULL;
        
        isStructuralHighInitialized = false;
        isStructuralLowInitialized = false;
    }

    ~CHighLowTimeframeData() {
        delete highTree;
        delete lowTree;
        delete activeHighs;
        delete activeLows;
        delete inactiveHighs;
        delete inactiveLows;
    }
};

// CHighLowDetector Class Definition
class CHighLowDetector : public CFeature {
private:
    CArrayObj* timeframeDataArray;
    CArrayString* m_visibleObjects;
    int timeframes[];
    datetime m_currentDay;
    
    // Parameter für reguläre Swing-Erkennung
    int m_length;
    
    // Parameter für Initialisierung
    int m_structureInitLength;

    CHighLowTimeframeData* GetOrCreateTimeframeData(int timeframe);
    CHighLowTimeframeData* GetTimeframeData(int timeframe);
    void CheckRegularLow(CCandle* previous, CCandle* current, CCandle* next, CHighLowTimeframeData* data);
    void CheckRegularHigh(CCandle* previous, CCandle* current, CCandle* next, CHighLowTimeframeData* data);
    void CheckWilliamsLow(CCandle* previous2, CCandle* previous, CCandle* current, CCandle* next, CCandle* next2, CHighLowTimeframeData* data);
    void CheckWilliamsHigh(CCandle* previous2, CCandle* previous, CCandle* current, CCandle* next, CCandle* next2, CHighLowTimeframeData* data);
    void AddOrUpdateHighLow(CCandle* candle, bool isHigh, HighLowType type, CHighLowTimeframeData* data);
    CHighLow* FindHighLowForCandle(CCandle* candle, bool isHigh, CHighLowTimeframeData* data);
    void CheckBreaksAndSweeps(CCandle* currentCandle, int checkTimeframe);
    void ProcessBreakOrSweep(CHighLow* hl, CCandle* currentCandle, bool isHigh, CArrayObj* highLowsToDeactivate);
    void DeactivateHighLow(CHighLow* hl, CHighLowTimeframeData* data, bool isHigh);
    int FindHighLowIndex(CArrayObj* array, CHighLow* hl);
    void CheckNewDay(datetime date);
    
    // Neue Methoden für die Visualisierung
    void DrawStructuralLevel(CHighLow* highLow);
    string CreateObjectName(CHighLow* highLow);
    void ClearChartObjects();
    void ManageChartObjects();

public:
    CHighLowDetector();
    ~CHighLowDetector();
    
    virtual void Update(CCandle* candle) override;
    virtual void ProcessEvents() override;
    virtual string GetName() override;
    virtual void GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredTimeframes(int& timeframes[]) override;
    virtual void Initialize() override;
    virtual void Deinitialize() override;

    void UpdateTimeframeData(CCandle* candle);
    CHighLow* GetNextHigherHigh(CCandle* candle, int timeframe);
    CHighLow* GetNextLowerLow(CCandle* candle, int timeframe);
    CArrayObj* GetActiveHighs(int timeframe);
    CArrayObj* GetActiveLows(int timeframe);
    CArrayObj* GetInactiveHighs(int timeframe);
    CArrayObj* GetInactiveLows(int timeframe);
    void LimitInactiveHighLows(int timeframe, datetime expirationDate);
    CHighLow* FindCorrespondingHighLow(CHighLow* otherHL, int candleWindow = 0);
    CHighLow* SearchHighLowByTimeRange(datetime targetTime, int timeframe, bool isHigh, int candleWindow);
};

// Constructor Implementation
CHighLowDetector::CHighLowDetector() 
    : m_length(5), m_structureInitLength(12) {
    timeframeDataArray = new CArrayObj();
    m_visibleObjects = new CArrayString();
}

// Destructor Implementation
CHighLowDetector::~CHighLowDetector() {
    if(ShowHighLows) {
        ClearChartObjects();
    }
    delete m_visibleObjects;
    
    for(int i = 0; i < timeframeDataArray.Total(); i++) {
        CHighLowTimeframeData* data = timeframeDataArray.At(i);
        if(data != NULL) {
            delete data;
        }
    }
    delete timeframeDataArray;
}

void CHighLowDetector::ProcessBreakOrSweep(CHighLow* hl, CCandle* currentCandle, bool isHigh, CArrayObj* highLowsToDeactivate) {
    ENUM_BREAK_TYPE currentBreakType;
    ENUM_EVENT_TYPE eventType;
    CHighLowTimeframeData* data = GetTimeframeData(currentCandle.timeframe);
    if(data == NULL) return;
    
    if(isHigh) {
        currentBreakType = (currentCandle.close > hl.getSwingCandle().high) ? BT_BREAK : BT_SWEEP;
        eventType = (currentBreakType == BT_BREAK) ? EV_HIGH_BROKEN : EV_HIGH_SWEPT;
        
        // Initial Structural High - wenn noch kein strukturelles Level existiert und es ein Williams Pattern ist
        if(currentBreakType == BT_BREAK && data.lastLowestLow != NULL) {
            data.lastLowestLow.m_level = HL_LEVEL_STRUCTURE;
            DrawStructuralLevel(data.lastLowestLow);  // Zeichne das neue strukturelle Level
            data.lastLowestLow = NULL;
        }
        
    } else {
        currentBreakType = (currentCandle.close < hl.getSwingCandle().low) ? BT_BREAK : BT_SWEEP;
        eventType = (currentBreakType == BT_BREAK) ? EV_LOW_BROKEN : EV_LOW_SWEPT;

        if(currentBreakType == BT_BREAK && data.lastHighestHigh != NULL) {
            data.lastHighestHigh.m_level = HL_LEVEL_STRUCTURE;
            DrawStructuralLevel(data.lastHighestHigh);  // Zeichne das neue strukturelle Level
            data.lastHighestHigh = NULL;                       
        }        
    }
    
    hl.UpdateBreak(currentCandle, currentBreakType);
    CEvent* breakEvent = new CHighLowBrokenEvent(currentCandle.symbol, eventType, hl, currentCandle);
    CEventStore::GetInstance(currentCandle.symbol).AddEvent(breakEvent);
    
    // Mitigation logic
    if(!hl.GetMitigatedStatus(currentCandle.timeframe)) {
        ENUM_EVENT_TYPE mitigatedEventType = isHigh ? EV_HIGH_MITIGATED : EV_LOW_MITIGATED;
        CEvent* mitigatedEvent = new CHighLowBrokenEvent(currentCandle.symbol, mitigatedEventType, hl, currentCandle);
        CEventStore::GetInstance(currentCandle.symbol).AddEvent(mitigatedEvent);
        hl.SetMitigatedStatus(currentCandle.timeframe, true);
    }
    
    if(currentBreakType == BT_BREAK && currentCandle.timeframe == hl.getSwingCandle().timeframe) {
        highLowsToDeactivate.Add(hl);
    }
}

void CHighLowDetector::AddOrUpdateHighLow(CCandle* candle, bool isHigh, HighLowType type, CHighLowTimeframeData* data) {
    if(data == NULL) {
        CLogManager::GetInstance().LogMessage("CHighLowDetector::AddOrUpdateHighLow", LL_ERROR, "TimeframeData is NULL");
        return;
    }
    
    CHighLow* highLow = FindHighLowForCandle(candle, isHigh, data);
    
    if(highLow != NULL) {
        highLow.Update(type);
        return;
    }
    
    // Neues HighLow erstellen - immer als INTERNAL
    highLow = new CHighLow(candle, isHigh, type, HL_LEVEL_INTERNAL);
        
    // Tracking der Extrempunkte
    if(isHigh) {
        if(data.lastHighestHigh == NULL || 
           candle.high > data.lastHighestHigh.getSwingCandle().high) {
            data.lastHighestHigh = highLow;
            CLogManager::GetInstance().LogMessage("CHighLowDetector::AddOrUpdateHighLow", LL_DEBUG, 
                "Updated LastHighestHigh: "+data.lastHighestHigh.toString());
        }
    } else if(!isHigh) {
        if(data.lastLowestLow == NULL || 
           candle.low < data.lastLowestLow.getSwingCandle().low) {
            data.lastLowestLow = highLow;
            CLogManager::GetInstance().LogMessage("CHighLowDetector::AddOrUpdateHighLow", LL_DEBUG, 
                "Updated LastLowestLow: "+data.lastLowestLow.toString());
        }
    }
    
    if(isHigh) {
        data.activeHighs.Add(highLow);
        data.highTree.Insert(highLow);
    } else {
        data.activeLows.Add(highLow);
        data.lowTree.Insert(highLow);
    }
    
    ENUM_EVENT_TYPE eventType = isHigh ? EV_HIGH_CREATED : EV_LOW_CREATED;
    CEvent* createEvent = new CHighLowCreatedEvent(candle.symbol, eventType, highLow);
    CEventStore::GetInstance(candle.symbol).AddEvent(createEvent);
}

void CHighLowDetector::Update(CCandle* candle) {
    if(candle == NULL) return;

    CheckNewDay(candle.openTime);
    UpdateTimeframeData(candle);
    
    for(int i = 0; i < ArraySize(timeframes); i++) {
        if(timeframes[i] >= candle.timeframe)
            CheckBreaksAndSweeps(candle, timeframes[i]);
    }
    
    if(ShowHighLows) {
        ManageChartObjects();
    }
}

void CHighLowDetector::UpdateTimeframeData(CCandle* candle) {
    int timeframe = candle.timeframe;
    CHighLowTimeframeData* data = GetOrCreateTimeframeData(timeframe);
    
    CBaseChart* chart = CChartManager::GetInstance().GetChart(candle.symbol, timeframe);
    if(chart == NULL) return;
    
    int candlesCount = chart.getCandlesCount();
    int currentId = candle.id;
    
    if(currentId < 2) return;
    
    CCandle* previous = chart.getCandleById(currentId - 2);
    CCandle* current = chart.getCandleById(currentId - 1);
    CCandle* next = candle;
    
    if(previous == NULL || next == NULL) return;
    
    CheckRegularLow(previous, current, next, data);
    CheckRegularHigh(previous, current, next, data);
    
    if(currentId > 4) {
        CCandle* previous2 = chart.getCandleById(currentId - 4);
        previous = chart.getCandleById(currentId - 3);
        current = chart.getCandleById(currentId - 2);
        next = chart.getCandleById(currentId - 1);
        CCandle* next2 = candle;
        
        if(previous2 != NULL && next2 != NULL) {
            CheckWilliamsLow(previous2, previous, current, next, next2, data);
            CheckWilliamsHigh(previous2, previous, current, next, next2, data);
        }
    }
}

void CHighLowDetector::CheckRegularLow(CCandle* previous, CCandle* current, CCandle* next, CHighLowTimeframeData* data) {
    if(previous.low >= current.low && next.low >= current.low) {
        AddOrUpdateHighLow(current, false, HL_REGULAR, data);
    }
}

void CHighLowDetector::CheckRegularHigh(CCandle* previous, CCandle* current, CCandle* next, CHighLowTimeframeData* data) {
    if(previous.high <= current.high && next.high <= current.high) {
        AddOrUpdateHighLow(current, true, HL_REGULAR, data);
    }
}

void CHighLowDetector::CheckWilliamsLow(CCandle* previous2, CCandle* previous, CCandle* current, CCandle* next, CCandle* next2, CHighLowTimeframeData* data) {
    if(previous2.low >= current.low && previous.low >= current.low &&
       next.low >= current.low && next2.low >= current.low) {
        AddOrUpdateHighLow(current, false, HL_WILLIAMS, data);
    }
}

void CHighLowDetector::CheckWilliamsHigh(CCandle* previous2, CCandle* previous, CCandle* current, CCandle* next, CCandle* next2, CHighLowTimeframeData* data) {
    if(previous2.high <= current.high && previous.high <= current.high &&
       next.high <= current.high && next2.high <= current.high) {
        AddOrUpdateHighLow(current, true, HL_WILLIAMS, data);
    }
}

CHighLow* CHighLowDetector::GetNextHigherHigh(CCandle* candle, int timeframe) {
    CHighLowTimeframeData* data = GetTimeframeData(timeframe);
    if(data == NULL) return NULL;
    
    ITreeNode* node = data.highTree.FindNextHigher(candle.high);
    if(node != NULL) {
        return (CHighLow*)node;
    }
    return NULL;
}

CHighLow* CHighLowDetector::GetNextLowerLow(CCandle* candle, int timeframe) {
    CHighLowTimeframeData* data = GetTimeframeData(timeframe);
    if(data == NULL) return NULL;
    
    ITreeNode* node = data.lowTree.FindNextLower(candle.low);
    if(node != NULL) {
        return (CHighLow*)node;
    }
    return NULL;
}

CHighLow* CHighLowDetector::FindHighLowForCandle(CCandle* candle, bool isHigh, CHighLowTimeframeData* data) {
    CArrayObj* activeArray = isHigh ? data.activeHighs : data.activeLows;
    for(int i = 0; i < activeArray.Total(); i++) {
        CHighLow* hl = activeArray.At(i);
        if(hl.getSwingCandle() == candle && hl.isHigh() == isHigh) {
            return hl;
        }
    }
    return NULL;
}

void CHighLowDetector::CheckBreaksAndSweeps(CCandle* currentCandle, int checkTimeframe) {
    CHighLowTimeframeData* data = GetTimeframeData(checkTimeframe);
    if(data == NULL) return;
    
    CArrayObj* highsToDeactivate = new CArrayObj();
    CArrayObj* lowsToDeactivate = new CArrayObj();
    
    for(int i = 0; i < data.activeHighs.Total(); i++) {
        CHighLow* hl = data.activeHighs.At(i);
        if(currentCandle.high > hl.getSwingCandle().high) {
            ProcessBreakOrSweep(hl, currentCandle, true, highsToDeactivate);
        }
    }
    
    for(int i = 0; i < data.activeLows.Total(); i++) {
        CHighLow* hl = data.activeLows.At(i);
        if(currentCandle.low < hl.getSwingCandle().low) {
            ProcessBreakOrSweep(hl, currentCandle, false, lowsToDeactivate);
        }
    }
    
    for(int i = 0; i < highsToDeactivate.Total(); i++) {
        CHighLow* hl = highsToDeactivate.At(i);
        DeactivateHighLow(hl, data, true);
    }
    
    for(int i = 0; i < lowsToDeactivate.Total(); i++) {
        CHighLow* hl = lowsToDeactivate.At(i);
        DeactivateHighLow(hl, data, false);
    }
    
    while (highsToDeactivate.Total() > 0)
        highsToDeactivate.Detach(0);
    delete highsToDeactivate;
    
    while (lowsToDeactivate.Total() > 0)
        lowsToDeactivate.Detach(0);    
    delete lowsToDeactivate;
}

void CHighLowDetector::DeactivateHighLow(CHighLow* hl, CHighLowTimeframeData* data, bool isHigh) {
    CArrayObj* activeArray = isHigh ? data.activeHighs : data.activeLows;
    CArrayObj* inactiveArray = isHigh ? data.inactiveHighs : data.inactiveLows;
    CRBTree* tree = isHigh ? data.highTree : data.lowTree;
    
    int index = FindHighLowIndex(activeArray, hl);
    if(index != -1) {
        CHighLow* detachedHL = activeArray.Detach(index);
        if(detachedHL != NULL) {
            tree.Remove(detachedHL);
            inactiveArray.Add(detachedHL);
        }
    }
}

int CHighLowDetector::FindHighLowIndex(CArrayObj* array, CHighLow* hl) {
    for(int i = 0; i < array.Total(); i++) {
        if(array.At(i) == hl) {
            return i;
        }
    }
    return -1;
}

void CHighLowDetector::CheckNewDay(datetime date) {
    if(m_currentDay != CHelper::NormalizeDate(date)) {
        int inactiveCount = 0;
        int activeCount = 0;
        m_currentDay = CHelper::NormalizeDate(date);
        for(int i = 0; i < timeframeDataArray.Total(); i++) {
            inactiveCount += ((CHighLowTimeframeData*)timeframeDataArray.At(i)).inactiveHighs.Total();
            inactiveCount += ((CHighLowTimeframeData*)timeframeDataArray.At(i)).inactiveLows.Total();
            activeCount += ((CHighLowTimeframeData*)timeframeDataArray.At(i)).activeHighs.Total();
            activeCount += ((CHighLowTimeframeData*)timeframeDataArray.At(i)).activeLows.Total();
        }
    }
}

void CHighLowDetector::DrawStructuralLevel(CHighLow* highLow) {
    if(!ShowHighLows) return;
    
    // Nur zeichnen, wenn das Timeframe des HighLows mit dem Chart-Timeframe übereinstimmt
    if(highLow.getSwingCandle().timeframe != Period()) return;
    
    if(!highLow.IsStructural()) return;
    
    string objectName = CreateObjectName(highLow);
    color objectColor = highLow.isHigh() ? clrGreen : clrRed;
    
    // Berechne Position und Größe des Kreises
    double price = highLow.isHigh() ? 
        highLow.getSwingCandle().high : highLow.getSwingCandle().low;
    datetime time = highLow.getSwingCandle().openTime;
    
    // Bestimme die Breite der Kerze für die Kreisgröße
    int candleWidth = (int)ChartGetInteger(0, CHART_SCALE);
    int circleSize = MathMax(4, candleWidth);
    
    // Lösche existierendes Objekt falls vorhanden
    if(ObjectFind(0, objectName) >= 0) {
        ObjectDelete(0, objectName);
    }
    
    // Erstelle den Pfeil
    if(!ObjectCreate(0, objectName, highLow.isHigh() ? OBJ_ARROW_UP : OBJ_ARROW_DOWN, 0, time, 
        highLow.isHigh() ? price + (10 * Point()) : price - (10 * Point()))) {
        Print("Failed to create arrow object: ", GetLastError());
        return;
    }
    
    ObjectSetInteger(0, objectName, OBJPROP_COLOR, objectColor);
    ObjectSetInteger(0, objectName, OBJPROP_WIDTH, circleSize);
    ObjectSetInteger(0, objectName, OBJPROP_BACK, false);
    ObjectSetInteger(0, objectName, OBJPROP_SELECTABLE, false);
    ObjectSetInteger(0, objectName, OBJPROP_HIDDEN, true);
    ObjectSetInteger(0, objectName, OBJPROP_ANCHOR, ANCHOR_BOTTOM);
    ObjectSetInteger(0, objectName, OBJPROP_ARROWCODE, highLow.isHigh() ? 241 : 242);
    
    m_visibleObjects.Add(objectName);
    ChartRedraw(0);
}

string CHighLowDetector::CreateObjectName(CHighLow* highLow) {
    return StringFormat("HL_%d_%d_%d", 
        Period(), 
        highLow.getId(),
        highLow.getSwingCandle().timeframe);
}

void CHighLowDetector::ClearChartObjects() {
    for(int i = m_visibleObjects.Total() - 1; i >= 0; i--) {
        string name = m_visibleObjects.At(i);
        if(ObjectFind(0, name) >= 0) {
            ObjectDelete(0, name);
        }
    }
    m_visibleObjects.Clear();
    ChartRedraw(0);
}

void CHighLowDetector::ManageChartObjects() {
    if(!ShowHighLows) return;
    
    // Prüfe und entferne nicht mehr existierende Objekte
    for(int i = m_visibleObjects.Total() - 1; i >= 0; i--) {
        string name = m_visibleObjects.At(i);
        if(ObjectFind(0, name) < 0) {
            m_visibleObjects.Delete(i);
        }
    }
}

CArrayObj* CHighLowDetector::GetActiveHighs(int timeframe) {
    CHighLowTimeframeData* data = GetTimeframeData(timeframe);
    return data != NULL ? data.activeHighs : NULL;
}

CArrayObj* CHighLowDetector::GetActiveLows(int timeframe) {
    CHighLowTimeframeData* data = GetTimeframeData(timeframe);
    return data != NULL ? data.activeLows : NULL;
}

CArrayObj* CHighLowDetector::GetInactiveHighs(int timeframe) {
    CHighLowTimeframeData* data = GetTimeframeData(timeframe);
    return data != NULL ? data.inactiveHighs : NULL;
}

CArrayObj* CHighLowDetector::GetInactiveLows(int timeframe) {
    CHighLowTimeframeData* data = GetTimeframeData(timeframe);
    return data != NULL ? data.inactiveLows : NULL;
}

void CHighLowDetector::LimitInactiveHighLows(int timeframe, datetime expirationDate) {
    CHighLowTimeframeData* data = GetTimeframeData(timeframe);
    if(data == NULL) return;
    
    // Remove expired inactive highs
    while(data.inactiveHighs.Total() > 0) {
        CHighLow* hl = data.inactiveHighs.At(0);
        if(hl.getSwingCandle().openTime < expirationDate) {
            data.inactiveHighs.Detach(0);
        } else {
            break;
        }
    }
    
    // Remove expired inactive lows
    while(data.inactiveLows.Total() > 0) {
        CHighLow* hl = data.inactiveLows.At(0);
        if(hl.getSwingCandle().openTime < expirationDate) {
            data.inactiveLows.Detach(0);
        } else {
            break;
        }
    }
}
 
CHighLow* CHighLowDetector::FindCorrespondingHighLow(CHighLow* otherHL, int candleWindow) {
    if(otherHL == NULL) return NULL;
    return SearchHighLowByTimeRange(otherHL.getSwingCandle().openTime, otherHL.getSwingCandle().timeframe, otherHL.isHigh(), candleWindow);
}

CHighLow* CHighLowDetector::SearchHighLowByTimeRange(datetime targetTime, int timeframe, bool isHigh, int candleWindow) {
    CHighLowTimeframeData* data = GetTimeframeData(timeframe);
    if(data == NULL) return NULL;
    
    int tfMinutes = CChartHelper::GetPeriodMinutes(timeframe);
    datetime startTime = targetTime - (candleWindow * tfMinutes * 60);
    datetime endTime = targetTime + (candleWindow * tfMinutes * 60);
    
    CHighLow* bestMatch = NULL;
    long minDiff = -1;

    // Helper lambda-ish loop to check arrays
    CArrayObj* arrays[2];
    arrays[0] = isHigh ? data.activeHighs : data.activeLows;
    arrays[1] = isHigh ? data.inactiveHighs : data.inactiveLows;
    
    for(int a = 0; a < 2; a++) {
        CArrayObj* currentArray = arrays[a];
        if(currentArray == NULL) continue;
        
        for(int i = 0; i < currentArray.Total(); i++) {
            CHighLow* hl = currentArray.At(i);
            datetime hlTime = hl.getSwingCandle().openTime;
            
            if(hlTime >= startTime && hlTime <= endTime) {
                long diff = MathAbs(hlTime - targetTime);
                if(minDiff == -1 || diff < minDiff) {
                    minDiff = diff;
                    bestMatch = hl;
                }
            }
        }
    }
    
    return bestMatch;
}

// Feature Interface Implementation
void CHighLowDetector::ProcessEvents() {
}

string CHighLowDetector::GetName() {
    return "HighLowDetector";
}

void CHighLowDetector::GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) {
    ArrayResize(eventTypes, 8);
    eventTypes[0] = EV_HIGH_CREATED;
    eventTypes[1] = EV_LOW_CREATED;
    eventTypes[2] = EV_HIGH_BROKEN;
    eventTypes[3] = EV_LOW_BROKEN;
    eventTypes[4] = EV_HIGH_SWEPT;
    eventTypes[5] = EV_LOW_SWEPT;
    eventTypes[6] = EV_HIGH_MITIGATED;
    eventTypes[7] = EV_LOW_MITIGATED;
}

void CHighLowDetector::GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) {
    ArrayResize(eventTypes, 0);
}

void CHighLowDetector::GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) {
    ArrayResize(eventTypes, 0);
}

void CHighLowDetector::GetRequiredTimeframes(int& timeframes[]) {
    ArrayResize(timeframes, 0);
}

void CHighLowDetector::Initialize() {
    if(ShowHighLows) {
        ClearChartObjects();
    }
}

void CHighLowDetector::Deinitialize() {
    if(ShowHighLows) {
        ClearChartObjects();
    }
}

CHighLowTimeframeData* CHighLowDetector::GetOrCreateTimeframeData(int timeframe) {
    CHighLowTimeframeData* data = GetTimeframeData(timeframe);
    if(data == NULL) {
        data = new CHighLowTimeframeData();
        timeframeDataArray.Add(data);
        ArrayResize(timeframes, ArraySize(timeframes) + 1);
        timeframes[ArraySize(timeframes) - 1] = timeframe;
    }
    return data;
}

CHighLowTimeframeData* CHighLowDetector::GetTimeframeData(int timeframe) {
    for(int i = 0; i < ArraySize(timeframes); i++) {
        if(timeframes[i] == timeframe) {
            return timeframeDataArray.At(i);
        }
    }
    return NULL;
}

#endif // HIGHLOW_DETECTOR_MQH


