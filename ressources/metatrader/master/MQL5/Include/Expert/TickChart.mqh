//+------------------------------------------------------------------+
//|                                                    TickChart.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.03"
#property strict

#ifndef TICK_CHART_MQH
#define TICK_CHART_MQH

#include <Expert\BaseChart.mqh>

class CTickChart : public CBaseChart {
private:
    int tickCount;
    double tickOpen;
    double tickHigh;
    double tickLow;
    long tickVolume;
    datetime tickOpenTime;
    
    void InitializeTickValues(MqlTick &tick);
    void UpdateTickValues(MqlTick &tick);
    void CreateTickCandle(MqlTick &tick);

public:
    CTickChart(string symbol, int timeframe);
    ~CTickChart();
    
    virtual void OnTick(MqlTick &tick);
    virtual datetime InitializeHistory(datetime startTime);
};

// CTickChart Implementation
CTickChart::CTickChart(string symbol, int timeframe) 
    : CBaseChart(symbol, timeframe) {
    tickCount = 0;
    tickOpen = 0;
    tickHigh = 0;
    tickLow = 0;
    tickVolume = 0;
    tickOpenTime = 0;
}

CTickChart::~CTickChart() {
}

void CTickChart::InitializeTickValues(MqlTick &tick) {
    tickCount = 1;
    tickOpen = tick.bid;
    tickHigh = tick.bid;
    tickLow = tick.bid;
    tickVolume = tick.volume;
    tickOpenTime = tick.time;
}

void CTickChart::UpdateTickValues(MqlTick &tick) {
    if(tick.bid > tickHigh) tickHigh = tick.bid;
    if(tick.bid < tickLow) tickLow = tick.bid;
    tickVolume += tick.volume;
    tickCount++;
}

void CTickChart::CreateTickCandle(MqlTick &tick) {
    CCandle* candle = new CCandle();
    candle.symbol = chart_symbol;
    candle.timeframe = chart_timeframe;
    candle.openTime = tickOpenTime;
    candle.closeTime = tick.time;
    candle.open = tickOpen;
    candle.high = tickHigh;
    candle.low = tickLow;
    candle.close = tick.bid;
    candle.volume = tickVolume;
    
    addCandle(candle);
    EmitNewCandleEvent(candle);
    
    // Nächste Ticksequenz vorbereiten
    lastCandleOpenTime = tick.time;
    InitializeTickValues(tick);
    // Open der neuen Kerze ist Close der alten
    tickOpen = candle.close;
}

void CTickChart::OnTick(MqlTick &tick) {
    if(tickCount == 0) {
        InitializeTickValues(tick);
    } else {
        UpdateTickValues(tick);
        if(tickCount >= CChartHelper::GetTickCount(chart_timeframe)) {
            CreateTickCandle(tick);
        }
    }
}

datetime CTickChart::InitializeHistory(datetime startTime) {
    // Tick-Charts haben keine Historie
    return TimeCurrent();
}

#endif


