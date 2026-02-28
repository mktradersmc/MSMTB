//+------------------------------------------------------------------+
//|                                                  ChartHelper.mqh |
//|                                   Copyright 2022, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2022, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.03"
#property strict

#ifndef SYMBOHELPER_MQH
#define SYMBOHELPER_MQH

#include <Object.mqh>

class CSymbolHelper : public CObject 
{ 
public:
   CSymbolHelper();
   ~CSymbolHelper();

   static int GetDigits(string symbol);
   static double NormalizePrice(double prize, string symbol);
};

CSymbolHelper::CSymbolHelper()
{
}

CSymbolHelper::~CSymbolHelper()
{
}

static int CSymbolHelper::GetDigits(string symbol)
{
   return (int)SymbolInfoInteger(symbol, SYMBOL_DIGITS);
}

static double CSymbolHelper::NormalizePrice(double price, string symbol)
{
   return NormalizeDouble(price, CSymbolHelper::GetDigits(symbol));
}

#endif // HELPER_MQH
