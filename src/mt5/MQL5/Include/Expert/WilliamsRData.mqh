//+------------------------------------------------------------------+
//|                                                WilliamsRData.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#include <Object.mqh>

class CWilliamsRData : public CObject
{
public:
   double value;
   
public:
   CWilliamsRData();
   ~CWilliamsRData();
};

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+
CWilliamsRData::CWilliamsRData()
{
}

//+------------------------------------------------------------------+
//|                                                                  |
//+------------------------------------------------------------------+
CWilliamsRData::~CWilliamsRData()
{
}

//+------------------------------------------------------------------+
