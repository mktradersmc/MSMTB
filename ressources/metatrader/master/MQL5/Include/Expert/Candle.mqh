//+------------------------------------------------------------------+
//|                                                  ChartHelper.mqh |
//|                                   Copyright 2022, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2022, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.01"
#property strict

#ifndef CANDLE_MQH
#define CANDLE_MQH

#include <Object.mqh>
#include <Expert\MarketCipherData.mqh>
#include <Expert\ChartHelper.mqh>

// CCandle Class Definition
class CCandle : public CObject
{
private:
    double m_statistics[];
    
public:
   CCandle();
   ~CCandle();
   
   int id;
   string symbol;
   int timeframe;
   datetime openTime;
   datetime closeTime;
   double high;
   double low;
   double open;
   double close;
   CMarketCipherData* marketCipherData;   
   double williamsRRange;
   long volume;
   double atrTrailingStop;
   
   string toString();
   double getHLC3();
   double getBodyTop();
   double getBodyBottom();
   double getBodySize();
   double getCandleSize();
   bool isUpCandle();
   bool isDownCandle();
   void SetStatisticsValue(int index, double value);
   double GetStatisticsValue(int index) const;
};

// CCandle Class Implementation
CCandle::CCandle()
{
   timeframe = 0;
   openTime = 0;
   high = 0;
   low = 0;
   open = 0;
   close = 0;
   marketCipherData = NULL;
}

CCandle::~CCandle()
{
   if(marketCipherData != NULL)
   {
      delete marketCipherData;
      marketCipherData = NULL;
   }
}

string CCandle::toString()
{
   string debug;
   debug = symbol + "." + CChartHelper::GetTimeframeName(timeframe) + 
           ". Id = " + IntegerToString(id) + 
           ", open-time = " + TimeToString(openTime, TIME_DATE|TIME_MINUTES|TIME_SECONDS) + 
           ", close-time = " + TimeToString(closeTime, TIME_DATE|TIME_MINUTES|TIME_SECONDS) + 
           ", open = " + DoubleToString(open, _Digits) + 
           ", high = " + DoubleToString(high, _Digits) + 
           ", low = " + DoubleToString(low, _Digits) + 
           ", close = " + DoubleToString(close, _Digits) + 
           ", williamsRRange = " + DoubleToString(williamsRRange, _Digits);
   return debug;
}


double CCandle::getHLC3()
{
   return (high+low+close)/3;
}

double CCandle::getBodyTop()
{
   return isUpCandle() ? close : open;
}

double CCandle::getBodyBottom()
{
   return isUpCandle() ? open : close;
}

double CCandle::getBodySize()
{
   return MathAbs(open - close);
}

double CCandle::getCandleSize()
{
   return MathAbs(high - low);
}

bool CCandle::isUpCandle()
{
   return close > open;
}

bool CCandle::isDownCandle()
{
   return close < open;
}

void CCandle::SetStatisticsValue(int index, double value)
{
    if(index >= ArraySize(m_statistics))
        ArrayResize(m_statistics, index + 1, 1);
    m_statistics[index] = value;
}

double CCandle::GetStatisticsValue(int index) const
{
    if(index < ArraySize(m_statistics))
        return m_statistics[index];
    return EMPTY_VALUE;
}

#endif


