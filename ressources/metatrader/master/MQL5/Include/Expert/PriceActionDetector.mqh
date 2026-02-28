//+------------------------------------------------------------------+
//|                                         PriceActionDetector.mqh |
//|                                   Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef PRICE_ACTION_DETECTOR_MQH
#define PRICE_ACTION_DETECTOR_MQH

#include <Expert\Candle.mqh>
#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Arrays/ArrayString.mqh>
#include <Expert\Event.mqh>
#include <Expert\PriceActionEvent.mqh>
#include <Expert\EventStore.mqh>
#include <Expert\ChartManager.mqh>
#include <Expert\BaseChart.mqh>
#include <Expert\Feature.mqh>
#include <Expert\EnvironmentManager.mqh>

// Input variables
input group "Price Action Parameter"
input int reversal_alarm_buffer_in_points = 15; // Zulässiger Abstand für (noch) Reversal Alarm
input int potential_reversal_alarm_buffer_in_points = 100; // Zulässiger Abstand für potenzielles Reversal Alarm
input int max_allowed_range_rebalance = 30; // Prozentualer Anteil, den die Vorgängerkerze bereits rebalanced sein darf

// CPriceActionTimeframeData Class Definition
class CPriceActionTimeframeData : public CObject {
public:
    // Tracking von Reversal-Mustern
    CArrayObj* detectedReversals;
    
    // Letztes erkanntes Bullish/Bearish Reversal für jeden Timeframe
    datetime lastBullishReversalTime;
    datetime lastBearishReversalTime;

    CPriceActionTimeframeData() {
        detectedReversals = new CArrayObj();
        lastBullishReversalTime = 0;
        lastBearishReversalTime = 0;
    }

    ~CPriceActionTimeframeData() {
        delete detectedReversals;
    }
};

// CPriceActionDetector Class Definition
class CPriceActionDetector : public CFeature {
private:
    CArrayObj* timeframeDataArray;
    int timeframes[];
    
    // Minimaler Kerzen-Größen-Faktor für gültige Reversals
    double m_minCandleSizeFactor;
    
    // Mindestanzahl an Kerzen, die in die gleiche Richtung gehen müssen, bevor ein Reversal erkannt wird
    int m_minTrendCandles;

    CPriceActionTimeframeData* GetOrCreateTimeframeData(int timeframe);
    CPriceActionTimeframeData* GetTimeframeData(int timeframe);
    void CheckForReversalPattern(CCandle* currentCandle);
    void CheckForPotentialReversal(CCandle* m15Candle);
    bool CheckPotentialBullishReversal(CCandle* lastCandle, CCandle* currentCandle);
    bool CheckPotentialBearishReversal(CCandle* lastCandle, CCandle* currentCandle);
    bool CheckBullishReversal(CCandle* previousCandle, CCandle* currentCandle, CBaseChart* chart);
    bool CheckBearishReversal(CCandle* previousCandle, CCandle* currentCandle, CBaseChart* chart);
    bool CheckPriorDowntrend(CBaseChart* chart, CCandle* pivotCandle, int count);
    bool CheckPriorUptrend(CBaseChart* chart, CCandle* pivotCandle, int count);
    bool IsTimeframeCloseApproaching(datetime m15Time, CCandle* developingCandle);
    bool IsHigherTimeframe(int timeframe);

public:
    CPriceActionDetector();
    ~CPriceActionDetector();
    
    virtual void Update(CCandle* candle) override;
    virtual void ProcessEvents() override;
    virtual string GetName() override;
    virtual void GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredTimeframes(int& timeframes[]) override;
    virtual void Initialize() override;
    virtual void Deinitialize() override;
};

// Constructor Implementation
CPriceActionDetector::CPriceActionDetector() 
    : m_minCandleSizeFactor(0.5), m_minTrendCandles(3) {
    timeframeDataArray = new CArrayObj();
}

// Destructor Implementation
CPriceActionDetector::~CPriceActionDetector() {
    for(int i = 0; i < timeframeDataArray.Total(); i++) {
        CPriceActionTimeframeData* data = timeframeDataArray.At(i);
        if(data != NULL) {
            delete data;
        }
    }
    delete timeframeDataArray;
}

void CPriceActionDetector::Update(CCandle* candle) {
    if(candle == NULL) return;
    
    // Überprüfe Reversal-Muster für den aktuellen Candle
    CheckForReversalPattern(candle);
    
    // Für das M15-Timeframe: Prüfe auf potenzielle Reversals für höhere Timeframes
    if(candle.timeframe == PERIOD_M15) {
        CheckForPotentialReversal(candle);
    }
}

void CPriceActionDetector::CheckForReversalPattern(CCandle* currentCandle) {
    int timeframe = currentCandle.timeframe;
    CPriceActionTimeframeData* data = GetOrCreateTimeframeData(timeframe);
    
    CBaseChart* chart = CChartManager::GetInstance().GetChart(currentCandle.symbol, timeframe);
    if(chart == NULL) return;
    
    int candlesCount = chart.getCandlesCount();
    int currentId = currentCandle.id;
    
    // Wir brauchen mindestens die vorherige Kerze
    if(currentId < 2) return;
    
    CCandle* previousCandle = chart.getCandleById(currentId - 1);
    if(previousCandle == NULL) return;
    
    bool bullishReversal = CheckBullishReversal(previousCandle, currentCandle, chart);
    bool bearishReversal = CheckBearishReversal(previousCandle, currentCandle, chart);
    
    ENUM_EVENT_TYPE eventType;
    ENUM_MARKET_DIRECTION direction;
    
    if(bullishReversal) {
        eventType = EV_PRICE_ACTION_REVERSAL;
        direction = MARKET_DIRECTION_BULLISH;
        data.lastBullishReversalTime = currentCandle.openTime;
        
        // Erstelle ein Event
        CEvent* reversalEvent = new CPriceActionEvent(
            currentCandle.symbol, 
            eventType, 
            currentCandle, 
            previousCandle,
            direction
        );
        
        CEventStore::GetInstance(currentCandle.symbol).AddEvent(reversalEvent);
        
        CLogManager::GetInstance().LogMessage("CPriceActionDetector::CheckForReversalPattern", 
            LL_INFO, 
            reversalEvent.GetDetails()
        );
    }
    
    if(bearishReversal) {
        eventType = EV_PRICE_ACTION_REVERSAL;
        direction = MARKET_DIRECTION_BEARISH;
        data.lastBearishReversalTime = currentCandle.openTime;
        
        // Erstelle ein Event
        CEvent* reversalEvent = new CPriceActionEvent(
            currentCandle.symbol, 
            eventType, 
            currentCandle, 
            previousCandle,
            direction
        );
        
        CEventStore::GetInstance(currentCandle.symbol).AddEvent(reversalEvent);
        
        CLogManager::GetInstance().LogMessage("CPriceActionDetector::CheckForReversalPattern", 
            LL_INFO, 
            reversalEvent.GetDetails()
        );
    }
}

bool CPriceActionDetector::CheckBullishReversal(CCandle* previousCandle, CCandle* currentCandle, CBaseChart* chart) {
    // Prüfe zuerst, ob es ein Gap gibt (Kerze öffnet außerhalb der Range der Vorgängerkerze)
    bool openedWithinPrevRange = (currentCandle.open >= previousCandle.low && currentCandle.open <= previousCandle.high);
    
    // Wenn ein Gap vorhanden ist, keine Reversal-Erkennung durchführen
    if(!openedWithinPrevRange) {
        CLogManager::GetInstance().LogMessage("CPriceActionDetector::CheckBullishReversal", LL_DEBUG, 
            StringFormat("Kerze öffnete mit Gap: open=%f, prev low=%f, prev high=%f - keine Reversal-Prüfung", 
                currentCandle.open, previousCandle.low, previousCandle.high));
        return false;
    }
    
    double maxDistance = _Point * reversal_alarm_buffer_in_points;
        
    // Bullish Reversal Bedingungen:
    // 1. Kerze hat das Low der Vorgängerkerze unterschritten
    bool penetratedPrevLow = currentCandle.low < previousCandle.low;
    
    // 2. Close der aktuellen Kerze ist oberhalb des Lows der Vorgängerkerze
    bool closedAbovePrevLow = currentCandle.close+maxDistance > previousCandle.low || currentCandle.close > previousCandle.low;
    
    // 3. Kerze ist nicht über das High der Vorgängerkerze gekommen
    bool belowPrevHigh = currentCandle.high <= previousCandle.high;

    // 4. Die aktuelle kerze darf nicht mehr als einen bestimmten prozentsatz der vorgängerkerze abgedeckt haben
    bool needToRebalance = currentCandle.high < (previousCandle.low + ((previousCandle.high-previousCandle.low)*max_allowed_range_rebalance/100));
    
    return penetratedPrevLow && closedAbovePrevLow && belowPrevHigh && needToRebalance;
}

bool CPriceActionDetector::CheckBearishReversal(CCandle* previousCandle, CCandle* currentCandle, CBaseChart* chart) {
    // Prüfe zuerst, ob es ein Gap gibt (Kerze öffnet außerhalb der Range der Vorgängerkerze)
    bool openedWithinPrevRange = (currentCandle.open >= previousCandle.low && currentCandle.open <= previousCandle.high);
    
    // Wenn ein Gap vorhanden ist, keine Reversal-Erkennung durchführen
    if(!openedWithinPrevRange) {
        CLogManager::GetInstance().LogMessage("CPriceActionDetector::CheckBearishReversal", LL_DEBUG, 
            StringFormat("Kerze öffnete mit Gap: open=%f, prev low=%f, prev high=%f - keine Reversal-Prüfung", 
                currentCandle.open, previousCandle.low, previousCandle.high));
        return false;
    }
    
    double maxDistance = _Point * reversal_alarm_buffer_in_points;
    
    // Bearish Reversal Bedingungen (umgekehrte Logik):
    // 1. Kerze hat das High der Vorgängerkerze überschritten
    bool penetratedPrevHigh = currentCandle.high > previousCandle.high;
    
    // 2. Close der aktuellen Kerze ist unterhalb des Highs der Vorgängerkerze
    bool closedBelowPrevHigh = (currentCandle.close-maxDistance) < previousCandle.high || currentCandle.close < previousCandle.high;

    // 3. Kerze ist nicht unter das Low der Vorgängerkerze gekommen
    bool abovePrevLow = currentCandle.low >= previousCandle.low;

    // 4. Die aktuelle kerze darf nicht mehr als einen bestimmten prozentsatz der vorgängerkerze abgedeckt haben
    bool needToRebalance = currentCandle.low > (previousCandle.high - ((previousCandle.high-previousCandle.low)*max_allowed_range_rebalance/100));
    
    return penetratedPrevHigh && closedBelowPrevHigh && abovePrevLow && needToRebalance;
}

bool CPriceActionDetector::CheckPriorDowntrend(CBaseChart* chart, CCandle* pivotCandle, int count) {
    if(chart == NULL || pivotCandle == NULL) return false;
    
    int pivotId = pivotCandle.id;
    
    // Prüfe, ob genug vorherige Kerzen verfügbar sind
    if(pivotId < count) return false;
    
    // Prüfe, ob die letzten 'count' Kerzen einen Abwärtstrend zeigen
    for(int i = 1; i <= count; i++) {
        CCandle* candle = chart.getCandleById(pivotId - i);
        if(candle == NULL) return false;
        
        // Einfache Downtrend-Erkennung: Jede Kerze hat ein tieferes Low als die vorherige
        if(i > 1) {
            CCandle* prevCandle = chart.getCandleById(pivotId - i + 1);
            if(prevCandle == NULL || candle.low > prevCandle.low) {
                return false;
            }
        }
    }
    
    return true;
}

bool CPriceActionDetector::CheckPriorUptrend(CBaseChart* chart, CCandle* pivotCandle, int count) {
    if(chart == NULL || pivotCandle == NULL) return false;
    
    int pivotId = pivotCandle.id;
    
    // Prüfe, ob genug vorherige Kerzen verfügbar sind
    if(pivotId < count) return false;
    
    // Prüfe, ob die letzten 'count' Kerzen einen Aufwärtstrend zeigen
    for(int i = 1; i <= count; i++) {
        CCandle* candle = chart.getCandleById(pivotId - i);
        if(candle == NULL) return false;
        
        // Einfache Uptrend-Erkennung: Jede Kerze hat ein höheres High als die vorherige
        if(i > 1) {
            CCandle* prevCandle = chart.getCandleById(pivotId - i + 1);
            if(prevCandle == NULL || candle.high < prevCandle.high) {
                return false;
            }
        }
    }
    
    return true;
}

//+------------------------------------------------------------------+
//| Prüft, ob ein Timeframe H1 oder höher ist                       |
//+------------------------------------------------------------------+
bool CPriceActionDetector::IsHigherTimeframe(int timeframe) {
    return timeframe >= PERIOD_H1;
}

//+------------------------------------------------------------------+
//| Prüft, ob die aktuelle M15-Kerze genau 15 Minuten vor dem Ende    |
//| einer höheren Timeframe-Periode liegt                            |
//+------------------------------------------------------------------+
bool CPriceActionDetector::IsTimeframeCloseApproaching(datetime currentTime, CCandle* developingCandle) {
    // Berechne die Endzeit der aktuellen M15-Kerze
    datetime m15EndTime = CChartHelper::GetNextTimeframeTime(currentTime, PERIOD_M15);
    
    
   CLogManager::GetInstance().LogMessage("CPriceActionDetector::IsTimeframeCloseApproaching", LL_DEBUG,
   StringFormat("Prüfe M15 Endzeit %s gegen %s Endzeit %s",
       TimeToString(m15EndTime), CChartHelper::GetTimeframeName(developingCandle.timeframe), TimeToString(developingCandle.closeTime)));

    // Eine M15-Kerze, die 15 Minuten vor dem Ende der höheren Timeframe-Periode liegt,
    // wäre diejenige, deren Endzeit genau 15 Minuten vor dem Ende der höheren Timeframe-Periode liegt
    if(developingCandle.closeTime == m15EndTime) {
        CLogManager::GetInstance().LogMessage("CPriceActionDetector::IsTimeframeCloseApproaching", LL_DEBUG,
            StringFormat("M15 Kerze (Ende: %s) ist genau 15 Minuten vor dem Ende der %s Periode (Ende: %s)",
                TimeToString(m15EndTime), CChartHelper::GetTimeframeName(developingCandle.timeframe), TimeToString(developingCandle.closeTime)));
        return true;
    }
    
    return false;
}

//+------------------------------------------------------------------+
//| Prüft auf potenzielle Reversals für höhere Timeframes            |
//+------------------------------------------------------------------+
void CPriceActionDetector::CheckForPotentialReversal(CCandle* m15Candle) {
    if(m15Candle == NULL) return;
    
    // Holen wir uns alle aktiven Timeframes
    int activeTimeframes[];
    
    CEnvironmentManager::GetInstance().GetActiveTimeframes(activeTimeframes);

    // Prüfe jedes aktive Timeframe, das >= H1 ist
    for(int i = 0; i < ArraySize(activeTimeframes); i++) {
        int targetTf = activeTimeframes[i];
        CBaseChart* chart = CChartManager::GetInstance().GetChart(m15Candle.symbol, targetTf);
        if(chart == NULL) continue;
            
        // Hole die aktuelle, in Entwicklung befindliche Kerze des Timeframes
        CCandle* currentCandle = chart.GetCurrentDevelopingCandle();
        
        // Überspringe Timeframes kleiner als H1
        if(!IsHigherTimeframe(targetTf)) continue;
        CLogManager::GetInstance().LogMessage("CPriceActionDetector::CheckBearishReversal", LL_DEBUG, 
            "Prüfe potenzielles Reversal gegen letzte "+CChartHelper::GetTimeframeName(targetTf)+" Kerze");
        
        // Prüfe, ob wir uns 15 Minuten vor dem Ende der Periode des Ziel-Timeframes befinden
        if(IsTimeframeCloseApproaching(m15Candle.closeTime, currentCandle)) {            
            int candlesCount = chart.getCandlesCount();
            if(candlesCount < 1) continue; // Wir brauchen mindestens eine abgeschlossene Kerze
            
            // Hole die letzte abgeschlossene Kerze
            CCandle* lastCandle = chart.getCandleById(candlesCount);
            if(lastCandle == NULL) continue;
            
            // Log zur Überprüfung
            CLogManager::GetInstance().LogMessage("CPriceActionDetector::CheckForPotentialReversal", LL_DEBUG,
                StringFormat("Prüfe Potenzial-Reversal für Timeframe %s - aktuelle Kerze time=%s, letzte abgeschlossene Kerze time=%s",
                    CChartHelper::GetTimeframeName(targetTf),
                    TimeToString(currentCandle.openTime), 
                    TimeToString(lastCandle.openTime)));
            
            // Prüfe auf potenzielle Reversals
            bool potentialBullishReversal = CheckPotentialBullishReversal(lastCandle, currentCandle);
            bool potentialBearishReversal = CheckPotentialBearishReversal(lastCandle, currentCandle);
            
            // Erstelle entsprechende Events
            ENUM_EVENT_TYPE eventType = EV_PRICE_ACTION_POTENTIAL_REVERSAL;
            
            if(potentialBullishReversal) {
                ENUM_MARKET_DIRECTION direction = MARKET_DIRECTION_BULLISH;
                CEvent* reversalEvent = new CPriceActionEvent(
                    m15Candle.symbol,
                    eventType,
                    currentCandle,
                    lastCandle,
                    direction
                );
                
                CEventStore::GetInstance(m15Candle.symbol).AddEvent(reversalEvent);
                
                CLogManager::GetInstance().LogMessage("CPriceActionDetector::CheckForPotentialReversal", 
                    LL_INFO, 
                    StringFormat("Potential Bullish Reversal detected at %s on %s timeframe", 
                        TimeToString(m15Candle.closeTime), CChartHelper::GetTimeframeName(targetTf))
                );
            }
            
            if(potentialBearishReversal) {
                ENUM_MARKET_DIRECTION direction = MARKET_DIRECTION_BEARISH;
                CEvent* reversalEvent = new CPriceActionEvent(
                    m15Candle.symbol,
                    eventType,
                    currentCandle,
                    lastCandle,
                    direction
                );
                
                CEventStore::GetInstance(m15Candle.symbol).AddEvent(reversalEvent);
                
                CLogManager::GetInstance().LogMessage("CPriceActionDetector::CheckForPotentialReversal", 
                    LL_INFO, 
                    StringFormat("Potential Bearish Reversal detected at %s on %s timeframe", 
                        TimeToString(m15Candle.closeTime), CChartHelper::GetTimeframeName(targetTf))
                );
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Prüft, ob ein potenzielles bullisches Reversal im Entstehen ist  |
//+------------------------------------------------------------------+
bool CPriceActionDetector::CheckPotentialBullishReversal(CCandle* lastCandle, CCandle* currentCandle) {
    if(lastCandle == NULL || currentCandle == NULL) return false;
    
    // Prüfe zuerst, ob es ein Gap gibt (Kerze öffnet außerhalb der Range der Vorgängerkerze)
    bool openedWithinPrevRange = (currentCandle.open >= lastCandle.low && currentCandle.open <= lastCandle.high);
    
    // Wenn ein Gap vorhanden ist, keine Reversal-Erkennung durchführen
    if(!openedWithinPrevRange) {
        CLogManager::GetInstance().LogMessage("CPriceActionDetector::CheckPotentialBullishReversal", LL_DEBUG, 
            StringFormat("Timeframe: %s - Kerze öffnete mit Gap: open=%f, prev low=%f, prev high=%f - keine Reversal-Prüfung", 
                CChartHelper::GetTimeframeName(currentCandle.timeframe),
                currentCandle.open, lastCandle.low, lastCandle.high));
        return false;
    }
    
    double maxDistance = _Point * potential_reversal_alarm_buffer_in_points;
    
    // 1. Die aktuelle Kerze muss das Low der letzten Kerze unterschreiten
    bool penetratedPrevLow = currentCandle.low < lastCandle.low;
    
    // 2. Der aktuelle Schlusskurs muss über dem Low der letzten Kerze liegen oder maximal 10 pips entfernt
    bool currentlyAbovePrevLow = currentCandle.close+maxDistance > lastCandle.low || currentCandle.close > lastCandle.low;
    
    // 3. Die aktuelle Kerze darf nicht über das High der letzten Kerze gegangen sein
    bool belowPrevHigh = currentCandle.high <= lastCandle.high;
    
    // 4. Die aktuelle kerze darf nicht mehr als einen bestimmten prozentsatz der vorgängerkerze abgedeckt haben
    bool needToRebalance = currentCandle.high < (lastCandle.low + ((lastCandle.high-lastCandle.low)*max_allowed_range_rebalance/100));
    
    // Debug-Logging
    CLogManager::GetInstance().LogMessage("CPriceActionDetector::CheckPotentialBullishReversal", LL_DEBUG,
        StringFormat("Timeframe: %s - penetratedPrevLow=%s, currentlyAbovePrevLow=%s, belowPrevHigh=%s, needToRebalance=%s",
            CChartHelper::GetTimeframeName(currentCandle.timeframe),
            penetratedPrevLow ? "true" : "false",
            currentlyAbovePrevLow ? "true" : "false",
            belowPrevHigh ? "true" : "false",
            needToRebalance? "true" : "false")
    );
    
    return penetratedPrevLow && currentlyAbovePrevLow && belowPrevHigh && needToRebalance;
}

//+------------------------------------------------------------------+
//| Prüft, ob ein potenzielles bearisches Reversal im Entstehen ist  |
//+------------------------------------------------------------------+
bool CPriceActionDetector::CheckPotentialBearishReversal(CCandle* lastCandle, CCandle* currentCandle) {
    if(lastCandle == NULL || currentCandle == NULL) return false;
    
    // Prüfe zuerst, ob es ein Gap gibt (Kerze öffnet außerhalb der Range der Vorgängerkerze)
    bool openedWithinPrevRange = (currentCandle.open >= lastCandle.low && currentCandle.open <= lastCandle.high);
    
    // Wenn ein Gap vorhanden ist, keine Reversal-Erkennung durchführen
    if(!openedWithinPrevRange) {
        CLogManager::GetInstance().LogMessage("CPriceActionDetector::CheckPotentialBearishReversal", LL_DEBUG, 
            StringFormat("Timeframe: %s - Kerze öffnete mit Gap: open=%f, prev low=%f, prev high=%f - keine Reversal-Prüfung", 
                CChartHelper::GetTimeframeName(currentCandle.timeframe),
                currentCandle.open, lastCandle.low, lastCandle.high));
        return false;
    }
    
    double maxDistance = _Point * potential_reversal_alarm_buffer_in_points;
    
    // 1. Die aktuelle Kerze muss das High der letzten Kerze überschreiten
    bool penetratedPrevHigh = currentCandle.high > lastCandle.high;
    
    // 2. Der aktuelle Schlusskurs muss unter dem High der letzten Kerze liegen
    bool currentlyBelowPrevHigh = (currentCandle.close-maxDistance) < lastCandle.high || currentCandle.close < lastCandle.high;
    
    // 3. Die aktuelle Kerze darf nicht unter das Low der letzten Kerze gefallen sein
    bool abovePrevLow = currentCandle.low >= lastCandle.low;

    // 4. Die aktuelle kerze darf nicht mehr als einen bestimmten prozentsatz der vorgängerkerze abgedeckt haben
    bool needToRebalance = currentCandle.low > (lastCandle.high - ((lastCandle.high-lastCandle.low)*max_allowed_range_rebalance/100));
    
    // Debug-Logging
    CLogManager::GetInstance().LogMessage("CPriceActionDetector::CheckPotentialBearishReversal", LL_DEBUG,
        StringFormat("Timeframe: %s - penetratedPrevHigh=%s, currentlyBelowPrevHigh=%s, abovePrevLow=%s, needToRebalance=%s",
            CChartHelper::GetTimeframeName(currentCandle.timeframe),
            penetratedPrevHigh ? "true" : "false",
            currentlyBelowPrevHigh ? "true" : "false",
            abovePrevLow ? "true" : "false",
            needToRebalance? "true" : "false")
    );
    
    return penetratedPrevHigh && currentlyBelowPrevHigh && abovePrevLow && needToRebalance;
}

void CPriceActionDetector::ProcessEvents() {
    // Diese Methode wird aufgerufen, wenn neue Events verarbeitet werden
    // In diesem Fall haben wir keine spezielle Behandlung
}

string CPriceActionDetector::GetName() {
    return "PriceActionDetector";
}

void CPriceActionDetector::GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) {
    ArrayResize(eventTypes, 2);
    eventTypes[0] = EV_PRICE_ACTION_REVERSAL;
    eventTypes[1] = EV_PRICE_ACTION_POTENTIAL_REVERSAL;
}

void CPriceActionDetector::GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) {
    // Dieser Detektor benötigt keine speziellen Events von anderen Features
    ArrayResize(eventTypes, 0);
}

void CPriceActionDetector::GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) {
    // Keine korrelierten Events nötig
    ArrayResize(eventTypes, 0);
}

void CPriceActionDetector::GetRequiredTimeframes(int& timeframes[]) {
    // Der PriceActionDetector benötigt das M15 Timeframe für EV_PRICE_ACTION_POTENTIAL_REVERSAL
    ArrayResize(timeframes, 1);
    timeframes[0] = PERIOD_M15;
}

void CPriceActionDetector::Initialize() {
    // Initialisierung des Detektors
    CLogManager::GetInstance().LogMessage("CPriceActionDetector::Initialize", LL_INFO, "Initializing PriceActionDetector");
}

void CPriceActionDetector::Deinitialize() {
    // Bereinigung, falls nötig
    CLogManager::GetInstance().LogMessage("CPriceActionDetector::Deinitialize", LL_INFO, "Deinitializing PriceActionDetector");
}

CPriceActionTimeframeData* CPriceActionDetector::GetOrCreateTimeframeData(int timeframe) {
    CPriceActionTimeframeData* data = GetTimeframeData(timeframe);
    if(data == NULL) {
        data = new CPriceActionTimeframeData();
        timeframeDataArray.Add(data);
        ArrayResize(timeframes, ArraySize(timeframes) + 1);
        timeframes[ArraySize(timeframes) - 1] = timeframe;
    }
    return data;
}

CPriceActionTimeframeData* CPriceActionDetector::GetTimeframeData(int timeframe) {
    for(int i = 0; i < ArraySize(timeframes); i++) {
        if(timeframes[i] == timeframe) {
            return timeframeDataArray.At(i);
        }
    }
    return NULL;
}

#endif // PRICE_ACTION_DETECTOR_MQH


