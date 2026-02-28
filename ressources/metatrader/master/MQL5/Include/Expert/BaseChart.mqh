//+------------------------------------------------------------------+
//|                                                        Chart.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.03"
#property strict

#ifndef CHART_MQH
#define CHART_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Event.mqh>
#include <Expert\NewCandleEvent.mqh>
#include <Expert\EventStore.mqh>
#include <Expert\Helper.mqh>
#include <Expert\ChartHelper.mqh>
#include <Expert\TechnicalAnalysisManager.mqh>
#include <Expert\StatisticsManager.mqh>

class CBaseChart : public CObject {
protected:
    CArrayObj *candles;
    string chart_symbol;
    int chart_timeframe;
    int symbol_digits;
    datetime lastCandleOpenTime;
    int maxSpread;
    
    int getCandleIndexByOpenTime(datetime candleOpenTime);
    void EmitNewCandleEvent(CCandle* candle);
    void addCandle(CCandle* candle);
    bool IsCandleWithinTradingHours(CCandle* candle);
    bool IsTimeInSession(datetime checkTime, datetime sessionStart, datetime sessionEnd);


private:
   datetime lastProcessTime;     // Letzte M1 Verarbeitungszeit
   uint lastTickCount;          // Für Zeitmessung
   datetime lastTickTime;       // Letzte Tick-Zeit
   
   // Statistik Variablen
   int tickCounter;             // Zähler für Ticks
   uint totalTimeBetweenTicks;  // Gesamtzeit zwischen Ticks
   uint maxTimeBetweenTicks;    // Maximale Zeit zwischen Ticks
   uint maxProcessingTime;      // Maximale Verarbeitungszeit

   void DebugTime();
   
public:
    CBaseChart(string symbol, int timeframe);
    ~CBaseChart();
    
    virtual void OnTick(MqlTick &tick) = 0;
    virtual datetime InitializeHistory(datetime startTime) = 0;
    
    CArrayObj *GetCandles() { return candles; }
    CCandle *getCandleAt(int index);
    CCandle *getCandleAtTime(datetime opentime);
    CCandle *getCandleById(int id);
    int getCandlesCount() { return candles.Total(); }
    void UpdateSpread(int currentSpread);
    int getTimeframe() { return chart_timeframe; }
    string getSymbol() { return chart_symbol; }
    CCandle* GetCurrentDevelopingCandle();
};

// CBaseChart Class Implementation
CBaseChart::CBaseChart(string symbol, int timeframe) {
    candles = new CArrayObj();
    chart_timeframe = timeframe;
    chart_symbol = symbol;
    symbol_digits = (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
    lastCandleOpenTime = 0;
    maxSpread = 0;
    
    lastProcessTime = 0;
    lastTickCount = 0;
    lastTickTime = 0;
   
    tickCounter = 0;
    totalTimeBetweenTicks = 0;
    maxTimeBetweenTicks = 0;
    maxProcessingTime = 0; 
}

CBaseChart::~CBaseChart() {
    for(int i = 0; i < candles.Total(); i++)
        delete candles.At(i);
    delete candles;
}

int CBaseChart::getCandleIndexByOpenTime(datetime candleOpenTime) {
    for (int i = candles.Total() - 1; i >= 0; i--) {
        CCandle *candle = candles.At(i);
        if (candle.openTime == candleOpenTime) return i;
    }
    return -1;
}

void CBaseChart::EmitNewCandleEvent(CCandle* candle) {
    CEvent* newCandleEvent = new CNewCandleEvent(chart_symbol, EV_NEW_CANDLE, candle);
    CEventStore::GetInstance(candle.symbol).AddEvent(newCandleEvent);
}

void CBaseChart::addCandle(CCandle* candle) {
    candle.id = candles.Total() + 1;
    candle.timeframe = chart_timeframe;
    candle.symbol = chart_symbol;
    candle.open = NormalizeDouble(candle.open, symbol_digits);
    candle.high = NormalizeDouble(candle.high, symbol_digits);
    candle.low = NormalizeDouble(candle.low, symbol_digits);
    candle.close = NormalizeDouble(candle.close, symbol_digits);
    candles.Add(candle);
    
//    if (IsCandleWithinTradingHours(candle))
//    {
        CStatisticsManager::GetInstance(chart_symbol).Update(candle);
        CTechnicalAnalysisManager::GetInstance(chart_symbol).Update(candle);
//    }
}

//+------------------------------------------------------------------+
//| Überprüft, ob eine bestimmte Zeit innerhalb einer Session liegt   |
//+------------------------------------------------------------------+
bool CBaseChart::IsTimeInSession(datetime checkTime, datetime sessionStart, datetime sessionEnd) {
    MqlDateTime timeStruct;
    TimeToStruct(checkTime, timeStruct);
    
    // Konvertiere Session-Zeiten zum aktuellen Tag
    datetime sessionStartTime = CHelper::GetDateForDay(checkTime, sessionStart);
    datetime sessionEndTime = CHelper::GetDateForDay(checkTime, sessionEnd);
    
    // Behandle Sessions über Mitternacht
    if(sessionEndTime <= sessionStartTime) {
        sessionEndTime += 24 * 60 * 60; // Füge 24 Stunden hinzu
    }
    
    return (checkTime >= sessionStartTime && checkTime <= sessionEndTime);
}

//+------------------------------------------------------------------+
//| Überprüft, ob eine Kerze innerhalb der Handelszeiten liegt        |
//+------------------------------------------------------------------+
bool CBaseChart::IsCandleWithinTradingHours(CCandle* candle) {
    if(candle == NULL) return false;
    
    // Zeit in eine MqlDateTime-Struktur umwandeln, um den Wochentag zu bestimmen
    MqlDateTime candleTimeStruct;
    TimeToStruct(candle.openTime, candleTimeStruct);
    ENUM_DAY_OF_WEEK dayOfWeek = (ENUM_DAY_OF_WEEK)candleTimeStruct.day_of_week;
    
    // Debug-Ausgabe
    string debugInfo = StringFormat("Checking candle: Symbol=%s, OpenTime=%s", 
                                  chart_symbol, 
                                  TimeToString(candle.openTime));
    Print(debugInfo);
    
    // Handelszeiten prüfen
    for(int sessionIndex = 0; sessionIndex < 7; sessionIndex++) {
        datetime sessionStart, sessionEnd;
        
        if(SymbolInfoSessionTrade(chart_symbol, dayOfWeek, sessionIndex, sessionStart, sessionEnd)) {
            // Debug-Ausgabe für Session-Zeiten
            string sessionInfo = StringFormat("Session %d: Start=%s, End=%s", 
                                           sessionIndex,
                                           TimeToString(sessionStart),
                                           TimeToString(sessionEnd));
            Print(sessionInfo);
            
            // Bestimme die tatsächliche Endzeit der Kerze (5 Minuten vor der closeTime)
            datetime actualCloseTime = candle.closeTime - 300; // 5 Minuten = 300 Sekunden
            
            // Prüfe, ob die Kerze innerhalb der Handelszeit liegt
            // Bei einer Daily Candle reicht es, wenn ein Teil der Kerze in der Handelszeit liegt
            bool openInSession = IsTimeInSession(candle.openTime, sessionStart, sessionEnd);
            bool closeInSession = IsTimeInSession(actualCloseTime, sessionStart, sessionEnd);
            bool sessionInCandle = (candle.openTime <= CHelper::GetDateForDay(candle.openTime, sessionStart) && 
                                  actualCloseTime >= CHelper::GetDateForDay(candle.openTime, sessionEnd));
            
            if(openInSession || closeInSession || sessionInCandle) {
                Print("Candle is within trading hours");
                return true;
            }
        }
        else {
            // Wenn keine weitere Session gefunden wurde, beende die Schleife
            if(sessionIndex > 0) break;
        }
    }

    Print("Candle is outside trading hours");
    return false;
}

void CBaseChart::DebugTime() {
    uint currentTickCount = GetTickCount();
    
    if (lastTickCount > 0) {
        uint timeBetweenAdds = currentTickCount - lastTickCount;
        totalTimeBetweenTicks += timeBetweenAdds;
        maxTimeBetweenTicks = MathMax(maxTimeBetweenTicks, timeBetweenAdds);

        Print(StringFormat(
            "%s: Zeit seit letztem AddCandle: %d ms", 
            CChartHelper::GetTimeframeName(chart_timeframe),
            timeBetweenAdds,
            maxTimeBetweenTicks,
            totalTimeBetweenTicks
        ));
    }

    lastTickCount = currentTickCount;
    lastProcessTime = TimeCurrent();
}

CCandle* CBaseChart::getCandleAt(int index) {
    if (index >= 0 && index < candles.Total()) {
        int pos = candles.Total() - 1 - index;
        return candles.At(pos);
    }
    return NULL;
}

CCandle* CBaseChart::getCandleAtTime(datetime opentime) {
    int index = getCandleIndexByOpenTime(opentime);
    return index != -1 ? candles.At(index) : NULL;
}

CCandle* CBaseChart::getCandleById(int id) {
    if (id > 0 && id <= candles.Total()) {
        return candles.At(id - 1);
    }
    return NULL;
}

void CBaseChart::UpdateSpread(int currentSpread) {
    if (currentSpread > maxSpread) maxSpread = currentSpread;
}

CCandle* CBaseChart::GetCurrentDevelopingCandle() {
    CCandle* currentCandle = new CCandle();
    
    // Initialisiere die Candle mit dem aktuellen Symbol und Timeframe
    currentCandle.symbol = chart_symbol;
    currentCandle.timeframe = chart_timeframe;
    
    // Verwende die eingebauten MQL-Arrays, um auf die aktuelle Kerze zuzugreifen
    MqlRates rates[];
    
    // Hole die aktuell im Bau befindliche Kerze (index 0)
    if(CopyRates(chart_symbol, (ENUM_TIMEFRAMES)chart_timeframe, 0, 1, rates) == 1) {
        // Fülle die Candle mit den aktuellen Daten
        currentCandle.openTime = rates[0].time;
        currentCandle.open = rates[0].open;
        currentCandle.high = rates[0].high;
        currentCandle.low = rates[0].low;
        currentCandle.close = rates[0].close;
        currentCandle.volume = rates[0].tick_volume;
        
        // Berechne die Endzeit der aktuellen Kerze basierend auf der Startzeit        
        currentCandle.closeTime = CChartHelper::CalculateCandleCloseTime(currentCandle.openTime, chart_timeframe);    
            
        // Setze die ID auf -1, um zu kennzeichnen, dass dies eine Developing-Kerze ist,
        // die nicht Teil des Candles-Arrays ist
        currentCandle.id = -1;
        
        // Normalisiere die Preise auf die korrekte Anzahl von Dezimalstellen
        currentCandle.open = NormalizeDouble(currentCandle.open, symbol_digits);
        currentCandle.high = NormalizeDouble(currentCandle.high, symbol_digits);
        currentCandle.low = NormalizeDouble(currentCandle.low, symbol_digits);
        currentCandle.close = NormalizeDouble(currentCandle.close, symbol_digits);
    } else {
        // Wenn wir die aktuelle Kerze nicht abrufen können, erstellen wir eine leere
        CLogManager::GetInstance().LogMessage("CBaseChart::GetCurrentDevelopingCandle",LL_ERROR,
            StringFormat("Konnte aktuelle Kerze für %s, Timeframe %s nicht abrufen", 
                chart_symbol, CChartHelper::GetTimeframeName(chart_timeframe)));
        
        // Versuche wenigstens die Zeitfenster korrekt zu setzen
        datetime currentTime = TimeCurrent();
        currentCandle.openTime = CChartHelper::AlignTimeToTimeframe(currentTime, chart_timeframe);
        currentCandle.closeTime = CChartHelper::GetNextTimeframeTime(currentCandle.openTime, chart_timeframe);
        
        // Verwende den aktuellen Tickpreis als Ersatz
        currentCandle.open = SymbolInfoDouble(chart_symbol, SYMBOL_BID);
        currentCandle.high = currentCandle.open;
        currentCandle.low = currentCandle.open;
        currentCandle.close = currentCandle.open;
        currentCandle.volume = 0;
        
        // Setze die ID auf -1, um zu kennzeichnen, dass dies eine Developing-Kerze ist,
        // die nicht Teil des Candles-Arrays ist
        currentCandle.id = -1;
    }
    
    return currentCandle;
}

#endif


