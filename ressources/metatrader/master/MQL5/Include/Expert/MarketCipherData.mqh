//+------------------------------------------------------------------+
//|                                                MarketCipherB.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.00"
#property strict

#ifndef MARKETCIPHER_DATA_MQH
#define MARKETCIPHER_DATA_MQH

#include <Object.mqh>

// CMarketCipherData Class Definition
class CMarketCipherData : public CObject
{
public:
   bool complete;
   double esa;
   bool hasEsa;
   double de;
   bool hasDe;
   double ci;
   bool hasCi;
   double wt1;
   bool hasWt1;
   double wt2;
   bool hasWt2;
   double wtVwap;
   bool wtCross;
   bool wtCrossUp;
   bool wtCrossDown;
   bool wtOversold;
   bool wtOverbought;

   CMarketCipherData();
   ~CMarketCipherData();
   
   string toString();
};

// CMarketCipherData Class Implementation
CMarketCipherData::CMarketCipherData()
{
   complete = false;
   wtCross = false;
   wtCrossUp = false;
   wtCrossDown = false;
   wtOversold = false;
   wtOverbought = false;
   hasEsa = false;
   hasDe = false;
   hasCi = false;
   hasWt1 = false;
   hasWt2 = false;
}

CMarketCipherData::~CMarketCipherData()
{
}

string CMarketCipherData::toString()
{
   string result;
   string signal = "none";
   if (wtCrossUp)
      signal = "buy";
   if (wtCrossDown)
      signal = "sell";
   
   result = "WT1 = " + NormalizeDouble(wt1, 1) + ", WT 2 = " + NormalizeDouble(wt2, 1) + 
            ", ESA = " + NormalizeDouble(esa, 1) + ", DE = " + NormalizeDouble(de, 1) + 
            ", CI = " + NormalizeDouble(ci, 1) + ", Signal = " + signal;
   
   return result;
}

#endif
