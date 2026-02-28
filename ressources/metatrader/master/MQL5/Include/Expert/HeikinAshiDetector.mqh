//+------------------------------------------------------------------+
//|                                           HeikinAshiDetector.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property strict

#ifndef HEIKIN_ASHI_DETECTOR_MQH
#define HEIKIN_ASHI_DETECTOR_MQH

#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Expert\Candle.mqh>
#include <Expert\Event.mqh>
#include <Expert\EventStore.mqh>
#include <Expert\HeikinAshiCandle.mqh>
#include <Expert\HeikinAshiNewCandleEvent.mqh>
#include <Expert\HeikinAshiTrendChangeEvent.mqh>

// CHeikinAshiTimeframeData Class Definition
class CHeikinAshiTimeframeData : public CObject
{
public:
    CArrayObj* heikinAshiCandles;
    CHeikinAshiCandle* currentHACandle;
    
    CHeikinAshiTimeframeData();
    ~CHeikinAshiTimeframeData();
};

// CHeikinAshiDetector Class Definition
class CHeikinAshiDetector : public CObject
{
private:
    CArrayObj* timeframeData;

    CHeikinAshiTimeframeData* GetOrCreateTimeframeData(int timeframe);
    void UpdateHeikinAshi(CCandle* currentCandle, CHeikinAshiTimeframeData* tfData);

public:
    CHeikinAshiDetector();
    ~CHeikinAshiDetector();
    void Update(CCandle* candle);
};

// CHeikinAshiTimeframeData Class Implementation
CHeikinAshiTimeframeData::CHeikinAshiTimeframeData()
{
    heikinAshiCandles = new CArrayObj();
    currentHACandle = NULL;
}

CHeikinAshiTimeframeData::~CHeikinAshiTimeframeData()
{
    delete heikinAshiCandles;
    if(currentHACandle != NULL)
        delete currentHACandle;
}

// CHeikinAshiDetector Class Implementation
CHeikinAshiDetector::CHeikinAshiDetector()
{
    timeframeData = new CArrayObj();
}

CHeikinAshiDetector::~CHeikinAshiDetector()
{
    for(int i = 0; i < timeframeData.Total(); i++)
    {
        delete timeframeData.At(i);
    }
    delete timeframeData;
}

void CHeikinAshiDetector::Update(CCandle* candle)
{
    if (candle == NULL) return;

    CHeikinAshiTimeframeData* tfData = GetOrCreateTimeframeData(candle.timeframe);
    UpdateHeikinAshi(candle, tfData);
}

CHeikinAshiTimeframeData* CHeikinAshiDetector::GetOrCreateTimeframeData(int timeframe)
{
    for(int i = 0; i < timeframeData.Total(); i++)
    {
        CHeikinAshiTimeframeData* tfData = timeframeData.At(i);
        if(tfData.currentHACandle != NULL && tfData.currentHACandle.timeframe == timeframe)
            return tfData;
    }
    
    CHeikinAshiTimeframeData* newTfData = new CHeikinAshiTimeframeData();
    timeframeData.Add(newTfData);
    return newTfData;
}

void CHeikinAshiDetector::UpdateHeikinAshi(CCandle* currentCandle, CHeikinAshiTimeframeData* tfData)
{
    double haOpen, haClose, haHigh, haLow;

    // Calculate HA_Close
    haClose = (currentCandle.open + currentCandle.high + currentCandle.low + currentCandle.close) / 4;

    // Calculate HA_Open
    if (tfData.heikinAshiCandles.Total() == 0)
    {
        haOpen = currentCandle.open;
    }
    else
    {
        CHeikinAshiCandle* previousHA = tfData.heikinAshiCandles.At(tfData.heikinAshiCandles.Total() - 1);
        haOpen = (previousHA.open + previousHA.close) / 2;
    }

    // Calculate HA_High and HA_Low
    haHigh = MathMax(currentCandle.high, MathMax(haOpen, haClose));
    haLow = MathMin(currentCandle.low, MathMin(haOpen, haClose));

    // Update or create the current Heikin-Ashi candle
    if(tfData.currentHACandle == NULL || tfData.currentHACandle.openTime != currentCandle.openTime)
    {
        if(tfData.currentHACandle != NULL)
        {
            // The previous candle is complete, add it to the list and trigger events
            tfData.heikinAshiCandles.Add(tfData.currentHACandle);
            
            CHeikinAshiNewCandleEvent* newHAEvent = new CHeikinAshiNewCandleEvent(currentCandle.symbol, tfData.currentHACandle);
            CEventStore::GetInstance(currentCandle.symbol).AddEvent(newHAEvent);

            if(tfData.heikinAshiCandles.Total() > 1)
            {
                CHeikinAshiCandle* previousHA = tfData.heikinAshiCandles.At(tfData.heikinAshiCandles.Total() - 2);
                if(tfData.currentHACandle.isLong != previousHA.isLong)
                {
                    CHeikinAshiTrendChangeEvent* trendChangeEvent = new CHeikinAshiTrendChangeEvent(
                        currentCandle.symbol,
                        tfData.currentHACandle.timeframe,
                        previousHA.isLong,
                        tfData.currentHACandle.isLong,
                        tfData.currentHACandle
                    );
                    CEventStore::GetInstance(currentCandle.symbol).AddEvent(trendChangeEvent);
                }
            }
        }
        
        // Create a new current Heikin-Ashi candle
        tfData.currentHACandle = new CHeikinAshiCandle(currentCandle.openTime, haOpen, haHigh, haLow, haClose, currentCandle.timeframe);
    }
    else
    {
        // Update the current Heikin-Ashi candle
        tfData.currentHACandle.open = haOpen;
        tfData.currentHACandle.high = MathMax(tfData.currentHACandle.high, haHigh);
        tfData.currentHACandle.low = MathMin(tfData.currentHACandle.low, haLow);
        tfData.currentHACandle.close = haClose;
        tfData.currentHACandle.isLong = haClose > haOpen;
        tfData.currentHACandle.isShort = haClose < haOpen;
    }
}

#endif


