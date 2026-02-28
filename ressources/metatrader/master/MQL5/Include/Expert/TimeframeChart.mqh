//+------------------------------------------------------------------+
//|                                                 TimeframeChart.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.03"
#property strict

#ifndef TIMEFRAME_CHART_MQH
#define TIMEFRAME_CHART_MQH

#include <Expert\BaseChart.mqh>

class CTimeframeChart : public CBaseChart {
private:
    CCandle* CreateCustomTimeframeCandle(datetime openTime, datetime closeTime);
    CCandle* CreateStandardTimeframeCandle(datetime openTime, datetime closeTime);
    bool IsCompleteCandle(CCandle* candle, datetime currentTime);
    int CalculateWeekOfYear(datetime time);
    static int CheckLoadHistory(string symbol, ENUM_TIMEFRAMES period, datetime start_date);
    
    void UpdateChartData(datetime startTime, datetime currentTime);

public:
    CTimeframeChart(string symbol, int timeframe);
    ~CTimeframeChart();
    
    virtual void OnTick(MqlTick &tick);
    virtual datetime InitializeHistory(datetime startTime);
};

// CTimeframeChart Implementation
CTimeframeChart::CTimeframeChart(string symbol, int timeframe) 
    : CBaseChart(symbol, timeframe) {
}

CTimeframeChart::~CTimeframeChart() {
}

bool CTimeframeChart::IsCompleteCandle(CCandle* candle, datetime currentTime) {
    return (currentTime - candle.openTime) >= chart_timeframe * 60;
}

int CTimeframeChart::CalculateWeekOfYear(datetime time) {
    MqlDateTime dt;
    TimeToStruct(time, dt);
    int dayOfYear = dt.day_of_year;
    int dayOfWeek = dt.day_of_week;
    if (dayOfWeek == 0) dayOfWeek = 7;
    int weekOfYear = (dayOfYear - dayOfWeek + 10) / 7;
    return weekOfYear;
}

CCandle* CTimeframeChart::CreateCustomTimeframeCandle(datetime openTime, datetime closeTime) {
    MqlRates ratesArray[];
    if (CopyRates(chart_symbol, PERIOD_M1, openTime, chart_timeframe, ratesArray) == chart_timeframe) { 
        CCandle* candle = new CCandle();            

        candle.openTime = openTime;
        candle.open = ratesArray[0].open;
        candle.high = ratesArray[0].high;
        candle.low = ratesArray[0].low;
        candle.close = ratesArray[chart_timeframe-1].close;
        long volume = 0;
        
        for (int i = 0; i < chart_timeframe; i++) {
            if (ratesArray[i].high > candle.high) candle.high = ratesArray[i].high;
            if (ratesArray[i].low < candle.low) candle.low = ratesArray[i].low;
            candle.volume += ratesArray[i].tick_volume;
        }
        
        return candle;
    }
    
    CLogManager::GetInstance().LogMessage("CTimeframeChart::CreateCustomTimeframeCandle",LL_DEBUG,"Copy Rates Error "+GetLastError()+": "+chart_symbol+", "+CChartHelper::GetTimeframeName(chart_timeframe)+", "+CHelper::TimeToString(openTime));   
    return NULL;
}

CCandle* CTimeframeChart::CreateStandardTimeframeCandle(datetime openTime, datetime closeTime) {
    MqlRates rateData[];
    if (CopyRates(chart_symbol, (ENUM_TIMEFRAMES)chart_timeframe, openTime, 1, rateData) == 1) {
        CCandle* candle = new CCandle();
        
        candle.openTime = openTime;
        candle.closeTime = closeTime;
        candle.open = rateData[0].open;
        candle.high = rateData[0].high;
        candle.low = rateData[0].low;
        candle.close = rateData[0].close;
        candle.volume = rateData[0].tick_volume;
        
        return candle;
    }
    
    CLogManager::GetInstance().LogMessage("CTimeframeChart::CreateStandardTimeframeCandle",LL_DEBUG,"Copy Rates Error "+GetLastError()+": "+chart_symbol+", "+CChartHelper::GetTimeframeName(chart_timeframe)+", "+CHelper::TimeToString(openTime));
    return NULL;
}

void CTimeframeChart::UpdateChartData(datetime startTime, datetime currentTime) {
    startTime = CChartHelper::AlignTimeToTimeframe(startTime, chart_timeframe,true);
    
    datetime newCandleOpenTime = CChartHelper::CalculateCandleCloseTime(startTime,chart_timeframe);
    datetime newCandleCloseTime = CChartHelper::CalculateCandleCloseTime(newCandleOpenTime,chart_timeframe);
    datetime lastCandleCloseTime = CChartHelper::AlignTimeToTimeframe(currentTime, chart_timeframe,true);
    
    while (currentTime >= newCandleCloseTime && newCandleCloseTime <= lastCandleCloseTime) {
        CCandle* newCandle = NULL;
        newCandle = CreateStandardTimeframeCandle(newCandleOpenTime, newCandleCloseTime);
        
        if (newCandle != NULL) {               
            addCandle(newCandle);
            lastCandleOpenTime = newCandle.openTime;
            EmitNewCandleEvent(newCandle);
        }
                
        newCandleOpenTime = CChartHelper::CalculateCandleCloseTime(lastCandleOpenTime,chart_timeframe);
        newCandleCloseTime = CChartHelper::CalculateCandleCloseTime(newCandleOpenTime,chart_timeframe);
    }
}


void CTimeframeChart::OnTick(MqlTick &tick) {
    UpdateChartData(lastCandleOpenTime, tick.time);
}

datetime CTimeframeChart::InitializeHistory(datetime startTime) {
    datetime endTime = CChartHelper::AlignTimeToTimeframe(TimeCurrent(), chart_timeframe,true);
    datetime actualStartTime = startTime;
    
    actualStartTime = actualStartTime - (chart_timeframe * 60);
    actualStartTime = CChartHelper::AlignTimeToTimeframe(actualStartTime, chart_timeframe,false);
    
    // Stelle sicher, dass das Symbol ausgewählt ist
    if(!SymbolInfoInteger(chart_symbol, SYMBOL_SELECT)) {
        SymbolSelect(chart_symbol, true);
    }
    
    // Versuche das Server-Startdatum zu ermitteln
    datetime serverFirstDate = 0;
    int maxAttempts = 5;
    int attempts = 0;
    
    // Mehrere Versuche für SERIES_SERVER_FIRSTDATE
    while(attempts < maxAttempts && !IsStopped()) {
        if(SeriesInfoInteger(chart_symbol, (ENUM_TIMEFRAMES)chart_timeframe, SERIES_SERVER_FIRSTDATE, serverFirstDate)) {
            if(serverFirstDate > 0) {
                CLogManager::GetInstance().LogMessage("CTimeframeChart::InitializeHistory",LL_DEBUG,
                    StringFormat("Server-Startdatum ermittelt: %s", TimeToString(serverFirstDate)));
                break;
            }
        }
        attempts++;
        Sleep(100); // Kurz warten zwischen den Versuchen
    }
    
    // Wenn SERIES_SERVER_FIRSTDATE fehlschlägt, versuche SERIES_FIRSTDATE
    if(serverFirstDate == 0) {
        datetime firstDate = 0;
        if(SeriesInfoInteger(chart_symbol, (ENUM_TIMEFRAMES)chart_timeframe, SERIES_FIRSTDATE, firstDate)) {
            if(firstDate > 0) {
                serverFirstDate = firstDate;
                CLogManager::GetInstance().LogMessage("CTimeframeChart::InitializeHistory",LL_DEBUG,
                    StringFormat("Erstes Datum der Serie ermittelt: %s", TimeToString(serverFirstDate)));
            }
        }
    }
    
    // Wenn beide Methoden fehlschlagen, verwende das aktuelle Startdatum
    if(serverFirstDate == 0) {
        CLogManager::GetInstance().LogMessage("CTimeframeChart::InitializeHistory",LL_DEBUG,
            "Konnte kein Startdatum ermitteln, verwende ursprüngliches Startdatum");
        serverFirstDate = actualStartTime;
    }
    
    // Wenn das gewünschte Startdatum vor dem ersten verfügbaren Datum liegt,
    // passe das Startdatum entsprechend an
    if(actualStartTime < serverFirstDate) {
        CLogManager::GetInstance().LogMessage("CTimeframeChart::InitializeHistory",LL_DEBUG,
            StringFormat("Gewünschtes Startdatum %s liegt vor verfügbarem Datum %s, passe an", 
            TimeToString(actualStartTime), TimeToString(serverFirstDate)));
        actualStartTime = serverFirstDate;
    }
    
    // Prüfe und lade die Historie
    int history = CheckLoadHistory(chart_symbol, (ENUM_TIMEFRAMES)chart_timeframe, actualStartTime);
    
    CLogManager::GetInstance().LogMessage("CTimeframeChart::InitializeHistory",LL_DEBUG,
        StringFormat("Initialisiere Historie für %s auf Timeframe %s von %s bis %s", 
        chart_symbol, 
        CChartHelper::GetTimeframeName(chart_timeframe),
        TimeToString(actualStartTime),
        TimeToString(endTime)));
                
    UpdateChartData(actualStartTime, endTime);
    
    if (candles.Total() > 0) {
        CCandle* firstCandle = candles.At(0);
        CCandle* lastCandle = candles.At(candles.Total() - 1);
        CLogManager::GetInstance().LogMessage("CTimeframeChart::InitializeHistory",LL_DEBUG,
            StringFormat("Erste Kerze: %s", firstCandle.toString()));
        CLogManager::GetInstance().LogMessage("CTimeframeChart::InitializeHistory",LL_DEBUG,
            StringFormat("Letzte Kerze: %s", lastCandle.toString()));
        CLogManager::GetInstance().LogMessage("CTimeframeChart::InitializeHistory",LL_DEBUG,
            StringFormat("Gesamtanzahl der initialisierten Kerzen: %d", candles.Total()));
    } else {
        CLogManager::GetInstance().LogMessage("CTimeframeChart::InitializeHistory",LL_DEBUG,
            "Warnung: Keine Kerzen wurden initialisiert.");
        return 0;
    }
    
    return actualStartTime;
}

int CTimeframeChart::CheckLoadHistory(string symbol, ENUM_TIMEFRAMES period, datetime start_date) {
    CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"CheckLoadHistory");
    CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Symbol: "+ symbol+ ", Periode: "+ EnumToString(period)+ ", Startdatum: "+ TimeToString(start_date));
    
    datetime first_date = 0;
    datetime times[100];
    if (symbol == NULL || symbol == "") symbol = Symbol();
    if (period == PERIOD_CURRENT) period = Period();
    
    CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Überprüfe Symbol-Auswahl");
    if (!SymbolInfoInteger(symbol, SYMBOL_SELECT)) {
        if (GetLastError() == ERR_MARKET_UNKNOWN_SYMBOL) {
            CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Fehler: Unbekanntes Symbol");
            return -1;
        }
        CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Symbol nicht ausgewählt, wird jetzt ausgewählt");
        SymbolSelect(symbol, true);
    }
    
    CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Ermittle erstes Datum der Serie");
    SeriesInfoInteger(symbol, period, SERIES_FIRSTDATE, first_date);
    CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Erstes Datum der Serie: "+ TimeToString(first_date));
    
    if (first_date > 0 && first_date <= start_date) {
        CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Erstes Datum innerhalb des gewünschten Bereichs, Return 1");
        return 1;
    }
    
    if (MQL5InfoInteger(MQL5_PROGRAM_TYPE) == PROGRAM_INDICATOR && Period() == period && Symbol() == symbol) {
        CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Laufzeitumgebung ist Indikator mit gleicher Periode und Symbol, Return -4");
        return -4;
    }
    
    CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Überprüfe Terminal-Erstdatum");
    if (SeriesInfoInteger(symbol, PERIOD_M1, SERIES_TERMINAL_FIRSTDATE, first_date)) {
        CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Terminal-Erstdatum: "+ TimeToString(first_date));
        if (first_date > 0) {
            CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Kopiere Zeit für erste Kerze");
            CopyTime(symbol, period, first_date + PeriodSeconds(period), 1, times);
            if (SeriesInfoInteger(symbol, period, SERIES_FIRSTDATE, first_date)) {
                CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Aktualisiertes erstes Datum der Serie: "+ TimeToString(first_date));
                if (first_date > 0 && first_date <= start_date) {
                    CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Erstes Datum innerhalb des gewünschten Bereichs, Return 2");
                    return 2;
                }
            }
        }
    }
    
    int max_bars = TerminalInfoInteger(TERMINAL_MAXBARS);
    CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Maximale Anzahl der Balken: "+ max_bars);
    
    datetime first_server_date = 0;
    CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Ermittle Server-Erstdatum");
    while (!SeriesInfoInteger(symbol, PERIOD_M1, SERIES_SERVER_FIRSTDATE, first_server_date) && !IsStopped()) {
        CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Warte auf Server-Erstdatum...");
        Sleep(5);
    }
    CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Server-Erstdatum: "+ TimeToString(first_server_date));
    
    if (first_server_date > start_date) {
        CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Server-Erstdatum später als gewünschtes Startdatum, passe Startdatum an");
        start_date = first_server_date;
    }
    
    if (first_date > 0 && first_date < first_server_date)
        CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Warnung: Server-Erstdatum "+ TimeToString(first_server_date)+ " für "+ symbol+
              " stimmt nicht mit dem ersten Serien-Datum "+ TimeToString(first_date)+ " überein");
    
    int fail_cnt = 0;
    while (!IsStopped()) {
        CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Überprüfe Synchronisation der Serie");
        while (!SeriesInfoInteger(symbol, period, SERIES_SYNCHRONIZED) && !IsStopped()) {
            CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Warte auf Synchronisation...");
            Sleep(5);
        }
        
        int bars = Bars(symbol, period);
        CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Anzahl der Balken: "+ bars);
        
        if (bars > 0) {
            if (bars >= max_bars) {
                CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Maximale Anzahl der Balken erreicht, Return -2");
                return -2;
            }
            if (SeriesInfoInteger(symbol, period, SERIES_FIRSTDATE, first_date)) {
                CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Aktualisiertes erstes Datum der Serie: "+ TimeToString(first_date));
                if (first_date > 0 && first_date <= start_date) {
                    CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Erstes Datum innerhalb des gewünschten Bereichs, Return 0");
                    return 0;
                }
            }
        }
        
        CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Kopiere Zeitdaten");
        int copied = CopyTime(symbol, period, bars, 100, times);
        CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Kopierte Zeitdaten: "+ copied);
        
        if (copied > 0) {
            if (times[0] <= start_date) {
                CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Erster kopierter Zeitpunkt innerhalb des gewünschten Bereichs, Return 0");
                return 0;
            }
            if (bars + copied >= max_bars) {
                CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Gesamtanzahl der Balken überschreitet Maximum, Return -2");
                return -2;
            }
            fail_cnt = 0;
        } else {
            fail_cnt++;
            CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Fehler beim Kopieren der Zeit, Fehlerzähler: "+ fail_cnt);
            if (fail_cnt >= 100) {
                CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Maximale Anzahl von Fehlversuchen erreicht, Return -5");
                return -5;
            }
            Sleep(10);
        }
    }
    
    CLogManager::GetInstance().LogMessage("CTimeframeChart::CheckLoadHistory",LL_DEBUG,"Funktion durch IsStopped() unterbrochen, Return -3");
    return -3;
}

#endif


