//+------------------------------------------------------------------+
//|                                          MarketCipherManager.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef MARKETCIPHER_MANAGER_MQH
#define MARKETCIPHER_MANAGER_MQH

enum ENUM_MOMENTUM
{
   MOMENTUM_Bullish = 1,
   MOMENTUM_Bearish = 2
};

#include <Expert\Candle.mqh>
#include <Expert\MomentumWave.mqh>
#include <Expert\MarketCipherModel.mqh>
#include <Expert\MarketCipherData.mqh>
#include <Expert\MarketCipherDivergenceEvent.mqh>
#include <Expert\MarketCipherMomentumShiftEvent.mqh>
#include <Expert\MarketCipherNewMomentumWaveEvent.mqh>
#include <Expert\EventStore.mqh>
#include <Arrays\ArrayObj.mqh>
#include <Expert\Feature.mqh>

// Globale Variablen als Input-Parameter
input ENUM_TIMEFRAMES mc_momentum_timeframe = PERIOD_H1; // Timeframe für Bias/Momentum Ermittlung
input int mc_momentum_wave_min_distance = 15; // MC Divergenz Mindestabstand Momentum Wellen in Minuten
input int mc_momentum_wave_max_distance = 180; // MC Divergenz maximaler Abstand Momentum Wellen in Minuten
double mc_min_wt2_trigger_wave_sell = 25; // WT2 Min-Level für Sell auf Signal
double mc_min_wt2_trigger_wave_buy = -25; // WT2 Min-Level für Buy auf Signal
double mc_min_wt2_anchor_wave_sell = 60; // Mindest wt2 der Anker Welle für Sell
double mc_min_wt2_anchor_wave_buy = -60; // Mindest wt2 der Anker Welle für Buy
input double mc_min_retracement_percentage = 75; // Mindestretracement der Ankerwelle
input double mc_min_chart_difference_in_points = 0; // Mindest-Höhendifferenz für Higher High bzw. Lower Low

// CMarketCipherManager Class Definition
class CMarketCipherManager : public CFeature
{
private:
    CArrayObj* marketCipherModels;
    ENUM_MOMENTUM currentMomentum;
    
    CMarketCipherModel* GetCreateMarketCipherModel(int timeframe);
    void UpdateMomentumWaves(CCandle* candle, CMarketCipherData* marketCipherData);
    bool CheckValidRetracement(CMomentumWave* wave, CCandle* currentCandle);

public:
    CMarketCipherManager();
    ~CMarketCipherManager();

    virtual void Update(CCandle* candle) override;
    virtual void ProcessEvents() override;
    virtual string GetName() override;
    virtual void GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredTimeframes(int& timeframes[]) override;
    virtual void GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override;
    virtual void Initialize() override;
    virtual void Deinitialize() override;

    ENUM_MOMENTUM GetCurrentMomentum();
    bool IsMarketCipherMomentumChange(CCandle* candle);
    CMomentumWave* FindMarketCipherDivergenceAnchorWave(CCandle* candle, int minDistance, int maxDistance, double min_wt2, bool debug = false);
    CMomentumWave* GetCurrentMomentumWave(CCandle* candle);
};

// CMarketCipherManager Class Implementation
CMarketCipherManager::CMarketCipherManager()
{
   marketCipherModels = new CArrayObj();
   currentMomentum = MOMENTUM_Bullish; // Set default value
}

CMarketCipherManager::~CMarketCipherManager()
{
   delete marketCipherModels;
}

void CMarketCipherManager::ProcessEvents() override {
}

string CMarketCipherManager::GetName() override {
   return "MarketCipherManager";
}

void CMarketCipherManager::GetSupportedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 3);
   eventTypes[0] = EV_MARKET_CIPHER_DIVERGENCE;
   eventTypes[1] = EV_MARKET_CIPHER_NEW_MOMENTUM_WAVE;
   eventTypes[2] = EV_MARKET_CIPHER_MOMENTUM_SHIFT;
}

void CMarketCipherManager::GetRequiredTimeframes(int& timeframes[]) override {
  ArrayResize(timeframes, 0);
}

void CMarketCipherManager::GetRequiredEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 0);
}

void CMarketCipherManager::GetRequiredCorrelatedEventTypes(ENUM_EVENT_TYPE& eventTypes[]) override {
   ArrayResize(eventTypes, 0);
}

void CMarketCipherManager::Initialize() override {
  // Initialisierung wird bereits im Konstruktor durchgeführt
}
  
void CMarketCipherManager::Deinitialize() override {
  // Cleanup wird bereits im Destruktor durchgeführt
}
    
void CMarketCipherManager::Update(CCandle* candle) override {
    if (candle == NULL) return;
  
    CMarketCipherModel* model = GetCreateMarketCipherModel(candle.timeframe);
    CMarketCipherData* marketCipherData = model.UpdateMarketCipherData(candle);
    
    if (marketCipherData != NULL)
    {
        UpdateMomentumWaves(candle, marketCipherData);
  
        // Update current momentum
        ENUM_MOMENTUM newMomentum = marketCipherData.wt2 > 0 ? MOMENTUM_Bullish : MOMENTUM_Bearish;
        if (newMomentum != currentMomentum)
        {
            ENUM_MOMENTUM oldMomentum = currentMomentum;
            currentMomentum = newMomentum;
            
            // Create and add Momentum-Shift event
            CMarketCipherMomentumShiftEvent* shiftEvent = new CMarketCipherMomentumShiftEvent(candle.symbol, candle.timeframe, oldMomentum, newMomentum, candle.openTime);
            CEventStore::GetInstance(candle.symbol).AddEvent(shiftEvent);
        }
    }
}

ENUM_MOMENTUM CMarketCipherManager::GetCurrentMomentum() 
{ 
   return currentMomentum; 
}

bool CMarketCipherManager::IsMarketCipherMomentumChange(CCandle* candle)
{
   CMarketCipherModel* model = GetCreateMarketCipherModel(candle.timeframe);
   CMarketCipherData* mcd = model.getMarketCipherData(candle.id);
   
   if (mcd == NULL) return false;
   
   ENUM_MOMENTUM newMomentum = mcd.wt2 > 0 ? MOMENTUM_Bullish : MOMENTUM_Bearish;
   return newMomentum != currentMomentum;
}

CMomentumWave* CMarketCipherManager::FindMarketCipherDivergenceAnchorWave(CCandle* candle, int minDistance, int maxDistance, double min_wt2, bool debug = false)
{
   CMarketCipherModel* model = GetCreateMarketCipherModel(candle.timeframe);
   CArrayObj* momentumWaves = model.GetMomentumWaves();
   if (momentumWaves.Total() < 2) return NULL;

   CMomentumWave* currentWave = momentumWaves.At(momentumWaves.Total() - 1);
   if (currentWave == NULL) return NULL;

   for (int i = momentumWaves.Total() - 2; i >= 0; i--)
   {
       CMomentumWave* wave = momentumWaves.At(i);
       
       int timePassed = candle.openTime - wave.signalCandle.openTime;
       
       if (timePassed < minDistance * 60) continue;
       if (timePassed > maxDistance * 60) break;
       
       bool isDivergence = false;
       
       if (currentWave.IsMountain())
       {
           double heightDiff = NormalizeDouble(MathAbs(wave.peakCandle.high - currentWave.peakCandle.high), _Digits) * MathPow(10, _Digits);
           if (wave.peakValue > currentWave.peakValue && 
               wave.peakCandle.high < candle.high && 
               wave.peakValue >= min_wt2 &&
               heightDiff >= mc_min_chart_difference_in_points)
           {
               isDivergence = true;
           }
       }
       else
       {
           double heightDiff = NormalizeDouble(MathAbs(wave.peakCandle.low - currentWave.peakCandle.low), _Digits) * MathPow(10, _Digits);
           if (wave.peakValue < currentWave.peakValue && 
               wave.peakCandle.low > candle.low && 
               wave.peakValue <= -min_wt2 &&
               heightDiff >= mc_min_chart_difference_in_points)
           {
               isDivergence = true;
           }
       }

       if (isDivergence && CheckValidRetracement(wave, candle))
       {
           if (debug)
           {
               Print("Divergence found");
               Print("Anchor Wave: " + wave.toString());
               Print("Current Wave: " + currentWave.toString());
           }
           return wave;
       }
   }
   
   return NULL;
}

bool CMarketCipherManager::CheckValidRetracement(CMomentumWave* wave, CCandle* currentCandle)
{
    CMarketCipherModel* model = GetCreateMarketCipherModel(currentCandle.timeframe); 
    double targetWt2 = wave.peakValue * mc_min_retracement_percentage / 100;
    int startIndex = wave.peakCandle.id;
    int endIndex = currentCandle.id;

    for (int i = startIndex; i < endIndex; i++)
    {
        CMarketCipherData* mcd = model.getMarketCipherData(i);
        if (mcd == NULL) continue;
        
        if (wave.IsMountain() && mcd.wt2 <= targetWt2)
        {
            return true;
        }
        
        if (wave.IsValley() && mcd.wt2 >= targetWt2)
        {
            return true;
        }                        
    }
    
    return false;
}

CMomentumWave* CMarketCipherManager::GetCurrentMomentumWave(CCandle* candle)
{
   CMarketCipherModel* model = GetCreateMarketCipherModel(candle.timeframe);
   CArrayObj* waves = model.GetMomentumWaves();
   return waves.At(waves.Total() - 1);
}

CMarketCipherModel* CMarketCipherManager::GetCreateMarketCipherModel(int timeframe)
{
    for (int i = 0; i < marketCipherModels.Total(); i++)
    {
        CMarketCipherModel* model = marketCipherModels.At(i);
        if (model.GetTimeframe() == timeframe)
            return model;
    }
    
    CMarketCipherModel* newModel = new CMarketCipherModel(timeframe);
    marketCipherModels.Add(newModel);
    return newModel;
}

void CMarketCipherManager::UpdateMomentumWaves(CCandle* candle, CMarketCipherData* marketCipherData)
{
    CMarketCipherModel* model = GetCreateMarketCipherModel(candle.timeframe);
    CArrayObj* momentumWaves = model.GetMomentumWaves();

    CMomentumWave* currentWave = NULL;
    if (momentumWaves.Total() > 0)
    {
        currentWave = momentumWaves.At(momentumWaves.Total() - 1);
    }

    bool newWaveStarted = false;

    if (marketCipherData.wtCross)
    {
        newWaveStarted = true;
    }
    else if (currentWave != NULL)
    {
        if (currentWave.IsMountain() && marketCipherData.wt2 < currentWave.peakValue)
        {
            newWaveStarted = true;
        }
        else if (currentWave.IsValley() && marketCipherData.wt2 > currentWave.peakValue)
        {
            newWaveStarted = true;
        }
    }

    if (newWaveStarted)
    {
        CMomentumWave* newWave = new CMomentumWave();
        newWave.direction = marketCipherData.wt2 > 0 ? 1 : -1;
        newWave.peakValue = marketCipherData.wt2;
        newWave.peakCandle = candle;
        newWave.signalValue = marketCipherData.wt2;
        newWave.signalCandle = candle;

        momentumWaves.Add(newWave);

        CMarketCipherNewMomentumWaveEvent* newWaveEvent = new CMarketCipherNewMomentumWaveEvent(candle.symbol, candle.timeframe,newWave);
        CEventStore::GetInstance(candle.symbol).AddEvent(newWaveEvent);
    }
    else if (currentWave != NULL)
    {
        if (currentWave.IsMountain() && marketCipherData.wt2 > currentWave.peakValue)
        {
            currentWave.peakValue = marketCipherData.wt2;
            currentWave.peakCandle = candle;
        }
        else if (currentWave.IsValley() && marketCipherData.wt2 < currentWave.peakValue)
        {
            currentWave.peakValue = marketCipherData.wt2;
            currentWave.peakCandle = candle;
        }
    }

    if (momentumWaves.Total() >= 2)
    {
        CMomentumWave* lastWave = momentumWaves.At(momentumWaves.Total() - 1);
        CMomentumWave* secondLastWave = momentumWaves.At(momentumWaves.Total() - 2);
        ENUM_MARKET_DIRECTION divergenceDirection;
        
        bool isDivergence = false;
        if (lastWave.IsMountain() && secondLastWave.IsMountain())
        {
            if (lastWave.peakValue < secondLastWave.peakValue && lastWave.peakCandle.high > secondLastWave.peakCandle.high)
            {
                isDivergence = true;
            }
        }
        else if (lastWave.IsValley() && secondLastWave.IsValley())
        {
            if (lastWave.peakValue > secondLastWave.peakValue && lastWave.peakCandle.low < secondLastWave.peakCandle.low)
            {
                isDivergence = true;
            }
        }

        if (isDivergence)
        {   
            CMarketCipherDivergenceEvent* divergenceEvent = new CMarketCipherDivergenceEvent(candle.symbol, candle.timeframe, secondLastWave, lastWave);
            CEventStore::GetInstance(candle.symbol).AddEvent(divergenceEvent);          
        }
    }
}

#endif


