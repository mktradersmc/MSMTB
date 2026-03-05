//+------------------------------------------------------------------+
//|                                          WilliamsROscillator.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef WILLIAMS_OSCILLARTOR_MQH
#define WILLIAMS_OSCILLARTOR_MQH

#include <Expert\ChartManager.mqh>
#include <Expert\Candle.mqh>

input group "Williams %R Range"
input int williams_r_period = 14; // Williams %R Lookback Period

class CBaseChart;

class CWilliamsROscillator : public CObject
{
private:
   double CWilliamsROscillator::GetPeriodHigh(CBaseChart* chart, CCandle* current);
   double CWilliamsROscillator::GetPeriodLow(CBaseChart* chart, CCandle* current);

public:
   CWilliamsROscillator();
   ~CWilliamsROscillator();

   void CWilliamsROscillator::Update(CCandle* candle);              
};

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+
CWilliamsROscillator::CWilliamsROscillator()
{
}

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+
CWilliamsROscillator::~CWilliamsROscillator()
{
}

void CWilliamsROscillator::Update(CCandle* candle)
{
   CBaseChart* chart = CBaseChartManager::GetInstance().GetChart(candle.symbol, candle.timeframe);
   int count = chart.GetCandles().Total();
   if (count <= williams_r_period)
      return;
    
   CCandle* current = chart.getCandleAt(0);
   CCandle* previous = chart.getCandleAt(1);
   double high = GetPeriodHigh(chart, current);
   double low = GetPeriodLow(chart,current);
   double difference = high-low;
   
   if (difference == 0) {
      current.williamsRRange = previous.williamsRRange;
   } else {
      current.williamsRRange = (high - current.close) / difference * -100;   
      current.williamsRRange = (current.williamsRRange * 2) + 100;
   } 
}

double CWilliamsROscillator::GetPeriodHigh(CBaseChart* chart, CCandle* current)
{
   double high = 0;
   if (current.id <= williams_r_period)
      return 0;
      
   for (int id=current.id; id>current.id-williams_r_period; id--)
   {
      CCandle* temp = chart.getCandleById(id);
      
      if (high == 0 || temp.high>high)
         high = temp.high;
   } 
   
   return high;
}

double CWilliamsROscillator::GetPeriodLow(CBaseChart* chart, CCandle* current)
{
   double low = 0;
   if (current.id <= williams_r_period)
      return 0;
      
   for (int id=current.id; id>current.id-williams_r_period; id--)
   {
      CCandle* temp = chart.getCandleById(id);
      
      if (low == 0 || temp.low<low)
         low = temp.low;
   } 
   
   return low;
}

#endif


