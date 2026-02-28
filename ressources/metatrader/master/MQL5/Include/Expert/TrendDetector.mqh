//+------------------------------------------------------------------+
//|                                                TrendDetector.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "1.00"

#ifndef TREND_DETECTOR_MQH
#define TREND_DETECTOR_MQH

#include <Expert\Event.mqh>
#include <Expert\ChartManager.mqh>
#include <Expert\StatisticsManager.mqh>
#include <Expert\TrendSignalEvent.mqh>
#include <Expert\Globals.mqh>
#include <Expert\LogManager.mqh>
#include <Expert\IConditionProvider.mqh>
#include <Expert\Feature.mqh>

// Globale Einstellungen für Trend Indikator
input group "Trend Indikator"
input int trend_length = 70;     // ZLEMA Length
input double trend_mult = 1.2;   // Band Multiplier
input bool trend_require_two_closes = false; // Zwei closes außerhalb für trend change notwendig

// Timeframe-spezifische Daten
class CTrendTimeframeData : public CObject 
{
public:
    int trend;           
    CTrendTimeframeData() : trend(0) {}
};

// Hauptklasse für Trend-Erkennung
class CTrendDetector : public CFeature
{
private:
    // Innere Klasse für die Instance-Daten
    class CInstanceData : public CObject
    {
    public:
        string symbol;
        CTrendDetector* instance;
        
        CInstanceData(string s, CTrendDetector* i) : symbol(s), instance(i) {}
    };

    static CArrayObj s_instances;
    string m_symbol;
    CArrayObj* m_timeframeDataArray;
    int m_timeframes[];
    
    CTrendTimeframeData* GetOrCreateTimeframeData(int timeframe);
    CTrendTimeframeData* GetTimeframeData(int timeframe);
    bool IsCrossOver(double value1, double value2, double lastValue1, double lastValue2);
    bool IsCrossUnder(double value1, double value2, double lastValue1, double lastValue2);
    void CheckSignals(CCandle* candle, CTrendTimeframeData* data);
        
public:
    CTrendDetector();
    ~CTrendDetector();
 
    virtual void Update(CCandle* candle) override;
    virtual void ProcessEvents() override;
    virtual string GetName() override;
    virtual void GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredTimeframes(int& timeframes[]) override;
    virtual void Initialize() override;
    virtual void Deinitialize() override;

    int GetTrend(int timeframe);

    // IConditionProvider Interface Implementation
    virtual bool ValidateCondition(const string& params[]) ;
    virtual string GetConditionDetails(const string& params[]) ;
    virtual string GetConditionDescription(const string& params[]) ;
    virtual int GetRequiredParameterCount() ;
};

// Static Member Initialisierung
CArrayObj CTrendDetector::s_instances;

CTrendDetector::CTrendDetector() {
    m_timeframeDataArray = new CArrayObj();
}

CTrendDetector::~CTrendDetector() {
    for(int i = 0; i < m_timeframeDataArray.Total(); i++) {
        delete m_timeframeDataArray.At(i);
    }
    delete m_timeframeDataArray;
}

CTrendTimeframeData* CTrendDetector::GetOrCreateTimeframeData(int timeframe) {
    CTrendTimeframeData* data = GetTimeframeData(timeframe);
    if(data == NULL) {
        data = new CTrendTimeframeData();
        m_timeframeDataArray.Add(data);
        ArrayResize(m_timeframes, ArraySize(m_timeframes) + 1);
        m_timeframes[ArraySize(m_timeframes) - 1] = timeframe;
    }
    return data;
}

CTrendTimeframeData* CTrendDetector::GetTimeframeData(int timeframe) {
    for(int i = 0; i < ArraySize(m_timeframes); i++) {
        if(m_timeframes[i] == timeframe) {
            return m_timeframeDataArray.At(i);
        }
    }
    return NULL;
}

bool CTrendDetector::IsCrossOver(double value1, double value2, double lastValue1, double lastValue2) {
    return value1 > value2 && lastValue1 <= lastValue2;
}

bool CTrendDetector::IsCrossUnder(double value1, double value2, double lastValue1, double lastValue2) {
    return value1 < value2 && lastValue1 >= lastValue2;
}

void CTrendDetector::CheckSignals(CCandle* candle, CTrendTimeframeData* data) {
    double additionalParams[];
    string message;
   
    double zlema = CStatisticsManager::GetInstance(candle.symbol)
        .GetStatisticsValue(candle, STAT_ZLEMA, trend_length);
        
    double rawVolatility = CStatisticsManager::GetInstance(candle.symbol)
        .GetStatisticsValue(candle, STAT_ATR_HIGHEST, trend_length);
   
    if(rawVolatility == EMPTY_VALUE || !MathIsValidNumber(rawVolatility)) {
        message = candle.symbol+"."+CChartHelper::GetTimeframeName(candle.timeframe)+": "+
                            CHelper::TimeToString(candle.openTime)+" Ungültige Volatilität - Berechnung wird abgebrochen";
        CLogManager::GetInstance().LogMessage("CTrendDetector::CheckSignals",LL_ERROR,message);
        return;
    }
   
    double volatility = CSymbolHelper::NormalizePrice(rawVolatility * trend_mult,candle.symbol);
    double upperBand = CSymbolHelper::NormalizePrice(zlema + volatility,candle.symbol);
    double lowerBand = CSymbolHelper::NormalizePrice(zlema - volatility,candle.symbol);
   
    message = candle.symbol+"."+CChartHelper::GetTimeframeName(candle.timeframe)+": "+
                   CHelper::TimeToString(candle.openTime)+", Close = "+candle.close+
         //          ", RawVolatility = "+rawVolatility+", Volatility = "+volatility+
                   ", UpperBand = "+upperBand+", LowerBand = "+lowerBand+", ZLEMA = "+zlema+", Trend = "+data.trend;
    CLogManager::GetInstance().LogMessage("CTrendDetector::CheckSignals",LL_DEBUG,message);

    // Hole vorherige Kerze für ZLEMA Crossover Check
    CCandle* previousCandle = CChartManager::GetInstance()
        .GetChart(candle.symbol, candle.timeframe)
        .getCandleById(candle.id - 1);
        
    if(previousCandle != NULL) {
        double previousZLEMA = CStatisticsManager::GetInstance(candle.symbol)
            .GetStatisticsValue(previousCandle, STAT_ZLEMA, trend_length);
            
        // Vorherige Volatilität und Bänder berechnen wenn nötig
        double previousVolatility = EMPTY_VALUE;
        double previousUpperBand = EMPTY_VALUE;
        double previousLowerBand = EMPTY_VALUE;
        
        int oldTrend = data.trend;
        
        // Trend-Änderungen prüfen
        if(!trend_require_two_closes) {
            // Originale Logik für einen Close
            if(candle.close > upperBand) {
                if(data.trend <= 0) {
                    data.trend = 1;
                    CEvent* bullishEvent = new CTrendSignalEvent(
                        candle.symbol, EV_TREND_CHANGE_BULLISH, candle);
                    CEventStore::GetInstance(candle.symbol).AddEvent(bullishEvent);
                }
            }
            else if(candle.close < lowerBand) {
                if(data.trend >= 0) {
                    data.trend = -1;
                    CEvent* bearishEvent = new CTrendSignalEvent(
                        candle.symbol, EV_TREND_CHANGE_BEARISH, candle);
                    CEventStore::GetInstance(candle.symbol).AddEvent(bearishEvent);
                }
            }
        }
        else {
            double previousRawVolatility = CStatisticsManager::GetInstance(candle.symbol)
                .GetStatisticsValue(previousCandle, STAT_ATR_HIGHEST, trend_length);
            previousVolatility = CSymbolHelper::NormalizePrice(previousRawVolatility * trend_mult, candle.symbol);
            previousUpperBand = CSymbolHelper::NormalizePrice(previousZLEMA + previousVolatility, candle.symbol);
            previousLowerBand = CSymbolHelper::NormalizePrice(previousZLEMA - previousVolatility, candle.symbol);

            // Neue Logik für zwei aufeinanderfolgende Closes
            if(previousCandle.close > previousUpperBand && candle.close > upperBand && data.trend <=0) {               
                 data.trend = 1;
                 CEvent* bullishEvent = new CTrendSignalEvent(
                     candle.symbol, EV_TREND_CHANGE_BULLISH, candle);
                 CEventStore::GetInstance(candle.symbol).AddEvent(bullishEvent);                
            }
            else if(previousCandle.close < previousLowerBand && candle.close < lowerBand && data.trend >= 0) {
                 data.trend = -1;
                 CEvent* bearishEvent = new CTrendSignalEvent(
                     candle.symbol, EV_TREND_CHANGE_BEARISH, candle);
                 CEventStore::GetInstance(candle.symbol).AddEvent(bearishEvent);
            }
        }
        
        // Entry Signale innerhalb des Trends prüfen - mit ZLEMA Crossover/Crossunder
        if(data.trend == 1 && oldTrend == 1) {
            if(previousCandle.close <= previousZLEMA && candle.close > zlema) {
                CEvent* entryEvent = new CTrendSignalEvent(
                    candle.symbol, EV_TREND_BULLISH_ENTRY_SIGNAL, candle);
                CEventStore::GetInstance(candle.symbol).AddEvent(entryEvent);
            }
        }
        else if(data.trend == -1 && oldTrend == -1) {
            if(previousCandle.close >= previousZLEMA && candle.close < zlema) {
                CEvent* entryEvent = new CTrendSignalEvent(
                    candle.symbol, EV_TREND_BEARISH_ENTRY_SIGNAL, candle);
                CEventStore::GetInstance(candle.symbol).AddEvent(entryEvent);
            }
        }
    }
}

void CTrendDetector::ProcessEvents() override {
}

string CTrendDetector::GetName() override {
   return "TrendDetector";
}

void CTrendDetector::GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 4);
   eventTypes[0] = EV_TREND_CHANGE_BULLISH;
   eventTypes[1] = EV_TREND_CHANGE_BEARISH;
   eventTypes[2] = EV_TREND_BULLISH_ENTRY_SIGNAL;
   eventTypes[3] = EV_TREND_BEARISH_ENTRY_SIGNAL;
}

void CTrendDetector::GetRequiredTimeframes(int& timeframes[]) override {
   ArrayResize(timeframes, 0);
}

void CTrendDetector::GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 0);
}

void CTrendDetector::GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 0);
}

void CTrendDetector::Initialize() override {
  // Initialisierung wird bereits im Konstruktor durchgeführt
}
  
void CTrendDetector::Deinitialize() override {
  // Cleanup wird bereits im Destruktor durchgeführt
}
    
void CTrendDetector::Update(CCandle* candle) override {
    if(candle == NULL) return;
    
    // Aktiviere benötigte Statistiken
    double additionalParams[];
    CStatisticsManager::GetInstance(candle.symbol)
        .ActivateStatistics(candle.timeframe, STAT_ZLEMA, trend_length);
    CStatisticsManager::GetInstance(candle.symbol)
        .ActivateStatistics(candle.timeframe, STAT_ATR_HIGHEST, trend_length);
        
    CTrendTimeframeData* data = GetOrCreateTimeframeData(candle.timeframe);
    CheckSignals(candle, data);
}

int CTrendDetector::GetTrend(int timeframe) {
    CTrendTimeframeData* data = GetTimeframeData(timeframe);
    return data != NULL ? data.trend : 0;
}

// IConditionProvider Interface Implementierung
bool CTrendDetector::ValidateCondition(const string& params[])
{
    if(ArraySize(params) < GetRequiredParameterCount()) 
        return false;
    
    CLogManager::GetInstance().LogMessage("CTrendDetector::ValidateCondition",LL_INFO,GetConditionDetails(params));
    int timeframe = CChartHelper::StringToTimeframe(params[0]);
    int expectedTrend = params[1] == "BULLISH" ? 1 : -1;
    
    return GetTrend(timeframe) == expectedTrend;
}

string CTrendDetector::GetConditionDetails(const string& params[])
{
    int timeframe = CChartHelper::StringToTimeframe(params[0]);
    int currentTrend = GetTrend(timeframe);
    return StringFormat("Market Bias on %s is %s (Expected: %s)", 
        params[0], 
        currentTrend == 1 ? "BULLISH" : (currentTrend == -1 ? "BEARISH" : "NEUTRAL"),
        params[1]);
}

string CTrendDetector::GetConditionDescription(const string& params[])
{
    int timeframe = CChartHelper::StringToTimeframe(params[0]);
    int currentTrend = GetTrend(timeframe);
    return StringFormat("Market Bias on %s is %s", 
        params[0], 
        params[1]);
}

int CTrendDetector::GetRequiredParameterCount()
{
    return 2;  // TIMEFRAME, DIRECTION
}

#endif


