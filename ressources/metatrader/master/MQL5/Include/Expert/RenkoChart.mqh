//+------------------------------------------------------------------+
//|                                                   RenkoChart.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.03"
#property strict

#ifndef RENKO_CHART_MQH
#define RENKO_CHART_MQH

#include <Expert\BaseChart.mqh>

class CRenkoChart : public CBaseChart {
private:
    double lastRenkoPrice;
    ENUM_MARKET_DIRECTION currentTrend;
    RenkoParams renkoParams;
    double boxPoints;
    double revPoints;
    long tickVolume;   // Zusätzlich für Volume-Tracking
    
    void UpdateRenkoState(MqlTick &tick);
    void CreateRenkoCandle(double openPrice, double closePrice, datetime time);

public:
    CRenkoChart(string symbol, int timeframe);
    ~CRenkoChart();
    
    virtual void OnTick(MqlTick &tick);
    virtual datetime InitializeHistory(datetime startTime);
};

// CRenkoChart Implementation
CRenkoChart::CRenkoChart(string symbol, int timeframe) 
    : CBaseChart(symbol, timeframe) {
    // Initialisierung Renko-Parameter
    renkoParams = RenkoParams(timeframe);
    boxPoints = renkoParams.boxSize * 0.1 * SymbolInfoDouble(symbol, SYMBOL_POINT);
    revPoints = renkoParams.reversalSize * 0.1 * SymbolInfoDouble(symbol, SYMBOL_POINT);
    lastRenkoPrice = 0;
    currentTrend = MARKET_DIRECTION_NEUTRAL;
    tickVolume = 0;
}

CRenkoChart::~CRenkoChart() {
}

void CRenkoChart::UpdateRenkoState(MqlTick &tick) {
    if(lastRenkoPrice == 0) {
        lastRenkoPrice = tick.bid;
        tickVolume = tick.volume;
        return;
    }
    
    tickVolume += tick.volume;
    double priceDiff = tick.bid - lastRenkoPrice;
    
    // Erste Kerze oder Trend-Initialisierung
    if(currentTrend == MARKET_DIRECTION_NEUTRAL) {
        if(MathAbs(priceDiff) >= boxPoints) {
            if(priceDiff > 0) {
                currentTrend = MARKET_DIRECTION_BULLISH;
                CreateRenkoCandle(lastRenkoPrice, lastRenkoPrice + boxPoints, tick.time);
            } else {
                currentTrend = MARKET_DIRECTION_BEARISH;
                CreateRenkoCandle(lastRenkoPrice, lastRenkoPrice - boxPoints, tick.time);
            }
        }
        return;
    }
    
    // Trend-Fortsetzung oder Reversal
    if(currentTrend == MARKET_DIRECTION_BULLISH) {
        if(priceDiff >= boxPoints) {
            CreateRenkoCandle(lastRenkoPrice, lastRenkoPrice + boxPoints, tick.time);
        }
        else if(priceDiff <= -revPoints) {
            currentTrend = MARKET_DIRECTION_BEARISH;
            CreateRenkoCandle(lastRenkoPrice, lastRenkoPrice - boxPoints, tick.time);
        }
    }
    else if(currentTrend == MARKET_DIRECTION_BEARISH) {
        if(priceDiff <= -boxPoints) {
            CreateRenkoCandle(lastRenkoPrice, lastRenkoPrice - boxPoints, tick.time);
        }
        else if(priceDiff >= revPoints) {
            currentTrend = MARKET_DIRECTION_BULLISH;
            CreateRenkoCandle(lastRenkoPrice, lastRenkoPrice + boxPoints, tick.time);
        }
    }
}

void CRenkoChart::CreateRenkoCandle(double openPrice, double closePrice, datetime time) {
    CCandle* candle = new CCandle();
    candle.symbol = chart_symbol;
    candle.timeframe = chart_timeframe;
    candle.openTime = time;
    candle.closeTime = time;
    candle.open = openPrice;
    candle.close = closePrice;
    candle.high = MathMax(openPrice, closePrice);
    candle.low = MathMin(openPrice, closePrice);
    candle.volume = tickVolume;
    
    addCandle(candle);
    EmitNewCandleEvent(candle);
    
    lastRenkoPrice = closePrice;
    tickVolume = 0;  // Reset Volume nach Kerzenerstellung
}

void CRenkoChart::OnTick(MqlTick &tick) {
    UpdateRenkoState(tick);
}

datetime CRenkoChart::InitializeHistory(datetime startTime) {
    // Renko-Charts haben keine Historie in der Tick-basierten Variante
    return TimeCurrent();
}

#endif


