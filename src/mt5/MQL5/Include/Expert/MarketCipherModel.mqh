//+------------------------------------------------------------------+
//|                                            MarketCipherModel.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef MARKETCIPHER_MODEL_MQH
#define MARKETCIPHER_MODEL_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\Candle.mqh>
#include <Expert\MarketCipherData.mqh>
#include <Expert\MomentumWave.mqh>

input group "Market Cipher"; // Market-Cipher
int wavetrend_channel_length = 9; // WT Channel Length
int wavetrend_average_length = 12; // WT Average Length
int wavetrend_ma_length = 3; // WT MA Length
double wavetrend_overbought_level = 53; // Wavetrend Überkauft Level
double wavetrend_oversold_level = -53; // Wavetrend Überverkauft Level

// CMarketCipherModel Class Definition
class CMarketCipherModel : public CObject
{
private:
    int timeframe;
    CArrayObj* marketCipherDataArray;
    CArrayObj* momentumWaves;
    double lastEsa;
    double lastDe;
    double lastWt1;
    int wt1CandlesCount;
    double lastWt1Values[];
    double lastWt2;
    int direction;
    bool directionChange;
    int lastCalculatedId;

    double CalculateSMA(double& data[]);
    double CalculateEMA(double previousEMA, double closingPrice, double period);

public:
    CMarketCipherModel(int modelTimeframe);
    ~CMarketCipherModel();
   
    int GetTimeframe();
    bool IsDirectionChange();
    int GetDirection();
    CMarketCipherData* UpdateMarketCipherData(CCandle* candle);
    CMarketCipherData* getMarketCipherData(int candleId);
    void SetMarketCipherData(int index, CMarketCipherData* data);
    CArrayObj* GetMomentumWaves();
};

// CMarketCipherModel Class Implementation
CMarketCipherModel::CMarketCipherModel(int modelTimeframe)
{
    timeframe = modelTimeframe;
    marketCipherDataArray = new CArrayObj();
    momentumWaves = new CArrayObj();
    wt1CandlesCount = 0;
    direction = 0;
    directionChange = false;
    lastCalculatedId = 0;
    lastEsa = 0;
    lastDe = 0;
    lastWt1 = 0;
    lastWt2 = 0;
    ArrayResize(lastWt1Values, wavetrend_ma_length);
}

CMarketCipherModel::~CMarketCipherModel()
{
    delete marketCipherDataArray;
    delete momentumWaves;
}

int CMarketCipherModel::GetTimeframe() { return timeframe; }
bool CMarketCipherModel::IsDirectionChange() { return directionChange; }
int CMarketCipherModel::GetDirection() { return direction; }

double CMarketCipherModel::CalculateSMA(double& data[])
{
    double sma = 0;
    for (int i = 0; i < ArraySize(data); i++) {
        sma += data[i];
    }
    return sma / ArraySize(data);
}

double CMarketCipherModel::CalculateEMA(double previousEMA, double closingPrice, double period)
{
    double alpha = 2.0 / (period + 1);
    return alpha * closingPrice + (1 - alpha) * previousEMA;
}

CMarketCipherData* CMarketCipherModel::UpdateMarketCipherData(CCandle* candle)
{
    if (candle == NULL || candle.id <= lastCalculatedId) return NULL;

    double esa = 0.0;
    double de = 0.0;
    double ci = 0.0;
    double wt1 = 0.0;
    double wt2 = 0.0;

    if (lastEsa == 0)
    {
        lastEsa = candle.getHLC3();     
        return NULL;   
    }
    else
    {
        esa = CalculateEMA(lastEsa, candle.getHLC3(), wavetrend_channel_length);
    }

    if (lastDe == 0)
    {
        lastDe = MathAbs(candle.getHLC3() - esa);
        return NULL;
    }
    else
    {
        de = CalculateEMA(lastDe, MathAbs(candle.getHLC3() - esa), wavetrend_channel_length);      
        ci = (candle.getHLC3() - esa) / (0.015 * de);
    }

    if (lastWt1 == 0)
    {
        lastWt1 = ci;
        return NULL;
    }
    else
    {
        wt1 = CalculateEMA(lastWt1, ci, wavetrend_average_length);  
    }

    if (wt1CandlesCount < wavetrend_ma_length)
    {
        lastWt1Values[wt1CandlesCount] = wt1;
        wt1CandlesCount++;
        return NULL;
    }
    else
    {
        lastWt1Values[wavetrend_ma_length-1] = wt1;
        wt2 = CalculateSMA(lastWt1Values);
  
        for (int i = 0; i < wavetrend_ma_length-1; i++)
        {
            lastWt1Values[i] = lastWt1Values[i+1];
        }
    }

    CMarketCipherData* mcd = new CMarketCipherData();
    mcd.esa = esa;
    mcd.de = de;
    mcd.ci = ci;
    mcd.wt1 = wt1;
    mcd.wt2 = wt2;
    mcd.wtVwap = wt1 - wt2;
    mcd.wtOversold = wt2 <= wavetrend_oversold_level;
    mcd.wtOverbought = wt2 >= wavetrend_overbought_level;
    mcd.complete = true;

    if (wt2 > lastWt2)
    {
        if (direction == -1) directionChange = true;
        if (direction == 1) directionChange = false;
        direction = 1;
    }
    else
    {
        if (direction == 1) directionChange = true;
        if (direction == -1) directionChange = false;
        direction = -1;
    }

    mcd.wtCross = (lastWt1 < lastWt2 && wt1 > wt2) || (lastWt2 < lastWt1 && wt2 > wt1);
    mcd.wtCrossUp = lastWt1 < lastWt2 && wt1 > wt2;
    mcd.wtCrossDown = lastWt2 < lastWt1 && wt2 > wt1;

    SetMarketCipherData(candle.id - 1, mcd);

    lastEsa = esa;
    lastDe = de;
    lastWt1 = wt1;
    lastWt2 = wt2;
    lastCalculatedId = candle.id;

    return mcd;
}

CMarketCipherData* CMarketCipherModel::getMarketCipherData(int candleId)
{
    return marketCipherDataArray.At(candleId - 1);
}

void CMarketCipherModel::SetMarketCipherData(int index, CMarketCipherData* data)
{
    while (index > marketCipherDataArray.Total())
    {
        marketCipherDataArray.Add(new CMarketCipherData);
    }      
    
    marketCipherDataArray.Add(data);
}

CArrayObj* CMarketCipherModel::GetMomentumWaves() { return momentumWaves; }

#endif


