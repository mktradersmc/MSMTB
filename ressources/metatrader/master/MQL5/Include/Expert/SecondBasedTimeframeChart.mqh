#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef SECOND_TIMEFRAME_CHART_MQH
#define SECOND_TIMEFRAME_CHART_MQH

#include <Expert\TimeframeChart.mqh>

class CSecondBasedTimeframeChart : public CTimeframeChart {
private:
    int timer_interval;
    CCandle* current_candle;
    
    void ProcessTick(MqlTick &tick);
    void UpdateCurrentCandle(MqlTick &tick);
    datetime GetNextCandleTime(datetime time);
    
public:
    CSecondBasedTimeframeChart(string symbol, int timeframe);
    ~CSecondBasedTimeframeChart();
    
    virtual void OnTick(MqlTick &tick) override;
    virtual datetime InitializeHistory(datetime startTime) override;
};

CSecondBasedTimeframeChart::CSecondBasedTimeframeChart(string symbol, int timeframe) 
    : CTimeframeChart(symbol, timeframe) {
    timer_interval = CChartHelper::GetPeriodSeconds(timeframe);
    current_candle = NULL;
}

CSecondBasedTimeframeChart::~CSecondBasedTimeframeChart() {
    if(current_candle != NULL) {
        delete current_candle;
    }
}

void CSecondBasedTimeframeChart::OnTick(MqlTick &tick) {
    ProcessTick(tick);
}

void CSecondBasedTimeframeChart::ProcessTick(MqlTick &tick) {
    datetime currentTime = tick.time;
    datetime alignedTime = CChartHelper::AlignTimeToSeconds(currentTime, timer_interval);
    
    // Prüfe ob eine neue Kerze beginnt
    if(current_candle != NULL && currentTime >= GetNextCandleTime(current_candle.openTime)) {
        // Ja, neue Kerze beginnt - also lade alle Ticks der letzten Kerze
        datetime lastCandleStart = current_candle.openTime;
        datetime lastCandleEnd = GetNextCandleTime(lastCandleStart);
        
        // Hole alle Ticks des letzten Kerzenzeitraums
        MqlTick ticks[];
        int tickCount = CopyTicksRange(chart_symbol, ticks, COPY_TICKS_ALL, 
                                     (ulong)(lastCandleStart * 1000), 
                                     (ulong)(lastCandleEnd * 1000));
        
        if(tickCount > 0) {
            // Erstelle die Kerze aus allen vorhandenen Ticks
            CCandle* lastCandle = new CCandle();
            lastCandle.openTime = lastCandleStart;
            lastCandle.closeTime = lastCandleEnd;
            lastCandle.open = ticks[0].last;
            lastCandle.high = ticks[0].last;
            lastCandle.low = ticks[0].last;
            lastCandle.volume = 0;
            
            for(int i = 0; i < tickCount; i++) {
                lastCandle.high = MathMax(lastCandle.high, ticks[i].last);
                lastCandle.low = MathMin(lastCandle.low, ticks[i].last);
                lastCandle.volume += ticks[i].volume;
            }
            lastCandle.close = ticks[tickCount-1].last;
            
            delete current_candle;
            addCandle(lastCandle);
            EmitNewCandleEvent(lastCandle);
        }
        
        // Starte neue Kerze
        current_candle = new CCandle();
        current_candle.openTime = alignedTime;
        current_candle.open = tick.last;
        current_candle.high = tick.last;
        current_candle.low = tick.last;
        current_candle.close = tick.last;
        current_candle.volume = tick.volume;
    }
    else if(current_candle == NULL) {
        // Erste Kerze initialisieren
        current_candle = new CCandle();
        current_candle.openTime = alignedTime;
        current_candle.open = tick.last;
        current_candle.high = tick.last;
        current_candle.low = tick.last;
        current_candle.close = tick.last;
        current_candle.volume = tick.volume;
    }
    else {
        // Aktualisiere laufende Kerze
        UpdateCurrentCandle(tick);
    }
}

void CSecondBasedTimeframeChart::UpdateCurrentCandle(MqlTick &tick) {
    current_candle.high = MathMax(current_candle.high, tick.last);
    current_candle.low = MathMin(current_candle.low, tick.last);
    current_candle.close = tick.last;
    current_candle.volume += tick.volume;
}

datetime CSecondBasedTimeframeChart::GetNextCandleTime(datetime time) {
    return CChartHelper::AlignTimeToSeconds(time + timer_interval, timer_interval);
}

datetime CSecondBasedTimeframeChart::InitializeHistory(datetime startTime) {
    datetime endTime = TimeCurrent();
    datetime actualStartTime = startTime;
    
    // Runde auf den nächsten vollständigen Intervall
    actualStartTime = CChartHelper::AlignTimeToSeconds(actualStartTime, timer_interval);
    
    datetime currentTime = actualStartTime;
    while(currentTime < endTime) {
        datetime nextCandleTime = GetNextCandleTime(currentTime);
        
        // Hole alle Ticks für diesen Kerzenzeitraum
        MqlTick ticks[];
        int tickCount = CopyTicksRange(chart_symbol, ticks, COPY_TICKS_ALL, 
                                     (ulong)(currentTime * 1000), 
                                     (ulong)(nextCandleTime * 1000));
        
        if(tickCount > 0) {
            // Erstelle Kerze aus allen verfügbaren Ticks
            CCandle* candle = new CCandle();
            candle.openTime = currentTime;
            candle.closeTime = nextCandleTime;
            candle.open = ticks[0].last;
            candle.high = ticks[0].last;
            candle.low = ticks[0].last;
            candle.volume = 0;
            
            for(int i = 0; i < tickCount; i++) {
                candle.high = MathMax(candle.high, ticks[i].last);
                candle.low = MathMin(candle.low, ticks[i].last);
                candle.volume += ticks[i].volume;
            }
            candle.close = ticks[tickCount-1].last;
            
            addCandle(candle);
            
            CLogManager::GetInstance().LogMessage("CSecondBasedTimeframeChart::InitializeHistory", LL_DEBUG,
                StringFormat("Kerze aus %d Ticks erstellt für Zeitraum %s bis %s", 
                tickCount,
                TimeToString(currentTime),
                TimeToString(nextCandleTime)));
        }
        
        currentTime = nextCandleTime;
    }
    
    return actualStartTime;
}

#endif

