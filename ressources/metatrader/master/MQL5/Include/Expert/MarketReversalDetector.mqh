//+------------------------------------------------------------------+
//|                                   MarketReversalDetector.mqh |
//|                                  Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef MARKET_REVERSAL_DETECTOR_MQH
#define MARKET_REVERSAL_DETECTOR_MQH

#include <Object.mqh>
#include <Expert\Candle.mqh>
#include <Expert\ChartManager.mqh>
#include <Expert\MarketReversalEvent.mqh>
#include <Expert\Feature.mqh>

class CTimeframeReversalStatus : public CObject
{
public:
    int timeframe;
    CCandle* pivotCandle;      // Kerze mit Hoch/Tief
    CCandle* referenceCandle;  // Die relevante Auf/Ab Kerze
    bool isBullish;            // True = letzter Pivot war ein Tief (suche nach bullischem Reversal)
    
    CTimeframeReversalStatus(int tf)
        : timeframe(tf),
          pivotCandle(NULL),
          referenceCandle(NULL),
          isBullish(false)
    {
    }
};

class CMarketReversalDetector : public CFeature
{
private:
    CArrayObj* tfStatus;  // Array von CTimeframeReversalStatus*
    
    CTimeframeReversalStatus* GetTimeframeStatus(int timeframe);
    bool IsHigherHigh(CCandle* current, CCandle* previous);
    bool IsLowerLow(CCandle* current, CCandle* previous);
    bool IsBullishCandle(CCandle* candle);
    bool IsBearishCandle(CCandle* candle);
    CCandle* FindLastDirectionalCandle(CBaseChart* chart, int fromId, bool findBullish);

public:
    CMarketReversalDetector();
    ~CMarketReversalDetector();
    
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

CMarketReversalDetector::CMarketReversalDetector()
{
    tfStatus = new CArrayObj();
}

CMarketReversalDetector::~CMarketReversalDetector()
{
    if(tfStatus != NULL)
    {
        delete tfStatus;
    }
}

CTimeframeReversalStatus* CMarketReversalDetector::GetTimeframeStatus(int timeframe)
{
    for(int i = 0; i < tfStatus.Total(); i++)
    {
        CTimeframeReversalStatus* status = tfStatus.At(i);
        if(status.timeframe == timeframe)
            return status;
    }
    
    CTimeframeReversalStatus* newStatus = new CTimeframeReversalStatus(timeframe);
    tfStatus.Add(newStatus);
    return newStatus;
}

void CMarketReversalDetector::ProcessEvents() override {
}

string CMarketReversalDetector::GetName() override {
   return "MarketReversalManager";
}

void CMarketReversalDetector::GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 1);
   eventTypes[0] = EV_MARKET_REVERSAL;
}

void CMarketReversalDetector::GetRequiredTimeframes(int& timeframes[]) override {
  ArrayResize(timeframes, 0);
}

void CMarketReversalDetector::GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 0);
}

void CMarketReversalDetector::GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 0);
}

void CMarketReversalDetector::Initialize() override {
  // Initialisierung wird bereits im Konstruktor durchgeführt
}
  
void CMarketReversalDetector::Deinitialize() override {
  // Cleanup wird bereits im Destruktor durchgeführt
}
    
void CMarketReversalDetector::Update(CCandle* candle) override {
    const bool debugThisTimeframe = (candle.timeframe == PERIOD_M15);  // Nur für M15 Debug-Ausgaben

    CTimeframeReversalStatus* status = GetTimeframeStatus(candle.timeframe);
    CBaseChart* chart = CChartManager::GetInstance().GetChart(candle.symbol, candle.timeframe);
    
    if(chart == NULL || candle.id < 2) return;
    
    CCandle* previousCandle = chart.getCandleById(candle.id - 1);
    
    // Prüfe auf neue/aktualisierte Pivot-Punkte
    bool updatePivot = false;
    bool isBullishPivot = status.isBullish;
    
    if(status.pivotCandle == NULL)
    {
        if(IsHigherHigh(candle, previousCandle))
        {
            updatePivot = true;
            isBullishPivot = false;
            if(debugThisTimeframe)
            {
                CLogManager::GetInstance().LogMessage("CMarketReversalDetector::Update", LL_DEBUG,
                    StringFormat("New High detected at %s: %.5f > %.5f", 
                    CHelper::TimeToString(candle.openTime),
                    candle.high, previousCandle.high));
            }
        }
        else if(IsLowerLow(candle, previousCandle))
        {
            updatePivot = true;
            isBullishPivot = true;
            if(debugThisTimeframe)
            {
                CLogManager::GetInstance().LogMessage("CMarketReversalDetector::Update", LL_DEBUG,
                    StringFormat("New Low detected at %s: %.5f < %.5f", 
                    CHelper::TimeToString(candle.openTime),
                    candle.low, previousCandle.low));
            }
        }
    }
    else // Bereits in einer Bewegung
    {
        if(!status.isBullish) // In Aufwärtsbewegung
        {
            if(candle.high > status.pivotCandle.high)
            {
                updatePivot = true;
                isBullishPivot = false;
                if(debugThisTimeframe)
                {
                    CLogManager::GetInstance().LogMessage("CMarketReversalDetector::Update", LL_DEBUG,
                        StringFormat("Higher High detected at %s: %.5f > %.5f", 
                        CHelper::TimeToString(candle.openTime),
                        candle.high, status.pivotCandle.high));
                }
            }
        }
        else // In Abwärtsbewegung
        {
            if(candle.low < status.pivotCandle.low)
            {
                updatePivot = true;
                isBullishPivot = true;
                if(debugThisTimeframe)
                {
                    CLogManager::GetInstance().LogMessage("CMarketReversalDetector::Update", LL_DEBUG,
                        StringFormat("Lower Low detected at %s: %.5f < %.5f", 
                        CHelper::TimeToString(candle.openTime),
                        candle.low, status.pivotCandle.low));
                }
            }
        }
    }
    
    if(updatePivot)
    {
        if(debugThisTimeframe)
        {
            CLogManager::GetInstance().LogMessage("CMarketReversalDetector::Update", LL_DEBUG,
                StringFormat("Setting new Pivot Candle at %s. Direction: %s", 
                CHelper::TimeToString(candle.openTime),
                isBullishPivot ? "Bullish" : "Bearish"));
        }
            
        status.pivotCandle = candle;
        status.isBullish = isBullishPivot;
        
        bool findBullish = !isBullishPivot;
        status.referenceCandle = FindLastDirectionalCandle(chart, candle.id, findBullish);
        
        if(debugThisTimeframe)
        {
            if(status.referenceCandle != NULL)
            {
                CLogManager::GetInstance().LogMessage("CMarketReversalDetector::Update", LL_DEBUG,
                    StringFormat("Found Reference Candle at %s. Type: %s, Open: %.5f", 
                    CHelper::TimeToString(status.referenceCandle.openTime),
                    findBullish ? "Bullish" : "Bearish",
                    status.referenceCandle.open));
            }
            else
            {
                CLogManager::GetInstance().LogMessage("CMarketReversalDetector::Update", LL_DEBUG,
                    "No Reference Candle found");
            }
        }
    }
    
    // Prüfe auf Reversal
    if(status.pivotCandle != NULL && status.referenceCandle != NULL)
    {
        bool isReversal = false;
        
        if(status.isBullish)  // Wir sind in einer Abwärtsbewegung, suchen bullischen Reversal
        {
            isReversal = candle.close > status.referenceCandle.high;
            if(debugThisTimeframe)
            {
                CLogManager::GetInstance().LogMessage("CMarketReversalDetector::Update", LL_DEBUG,
                    StringFormat("Checking Bullish Reversal at %s: Close %.5f vs Reference High %.5f", 
                    CHelper::TimeToString(candle.openTime),
                    candle.close, status.referenceCandle.open));
            }
        }
        else  // Wir sind in einer Aufwärtsbewegung, suchen bearischen Reversal
        {
            isReversal = candle.close < status.referenceCandle.low;
            if(debugThisTimeframe)
            {
                CLogManager::GetInstance().LogMessage("CMarketReversalDetector::Update", LL_DEBUG,
                    StringFormat("Checking Bearish Reversal at %s: Close %.5f vs Reference Low %.5f", 
                    CHelper::TimeToString(candle.openTime),
                    candle.close, status.referenceCandle.open));
            }
        }
        
        if(isReversal)
        {
            if(debugThisTimeframe)
            {
                CLogManager::GetInstance().LogMessage("CMarketReversalDetector::Update", LL_DEBUG,
                    StringFormat("%s Reversal detected at %s", 
                    status.isBullish ? "Bullish" : "Bearish",
                    CHelper::TimeToString(candle.openTime)));
            }
                
            CEvent* event = new CMarketReversalEvent(
                candle.symbol,
                status.pivotCandle,
                status.referenceCandle,
                candle,
                status.isBullish
            );
            CEventStore::GetInstance(candle.symbol).AddEvent(event);
            
            // Die Reversal-Kerze wird zur Referenzkerze und Pivot-Kerze für die Gegenrichtung
            status.referenceCandle = candle;
            status.pivotCandle = candle;
            status.isBullish = !status.isBullish;  // Richtungswechsel
        }
    }
}

bool CMarketReversalDetector::IsHigherHigh(CCandle* current, CCandle* previous)
{
    return current.high > previous.high;
}

bool CMarketReversalDetector::IsLowerLow(CCandle* current, CCandle* previous)
{
    return current.low < previous.low;
}

bool CMarketReversalDetector::IsBullishCandle(CCandle* candle)
{
    return candle.close > candle.open;
}

bool CMarketReversalDetector::IsBearishCandle(CCandle* candle)
{
    return candle.close < candle.open;
}

CCandle* CMarketReversalDetector::FindLastDirectionalCandle(CBaseChart* chart, int fromId, bool findBullish)
{
    // Gehe maximal 10 Kerzen zurück
    for(int i = fromId; i > fromId - 10 && i >= 0; i--)
    {
        CCandle* candle = chart.getCandleById(i);
        if(candle == NULL) continue;
        
        if(findBullish && IsBullishCandle(candle))
            return candle;
        else if(!findBullish && IsBearishCandle(candle))
            return candle;
    }
    
    return NULL;
}

#endif


