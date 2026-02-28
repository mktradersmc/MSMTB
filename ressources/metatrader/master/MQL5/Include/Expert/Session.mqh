//+------------------------------------------------------------------+
//|                                             CStrategyParser.mqh |
//|                                  Copyright 2023, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef SESSION_MQH
#define SESSION_MQH

#include <Object.mqh>
#include <Expert\Helper.mqh>

// CSession Class Definition
class CSession : public CObject
{
public:
    string id;
    string name;
    datetime startTime;
    datetime endTime;
    bool isActive;
    double sessionHigh;
    double sessionLow;
    string symbol;
    bool keyLevel;         // New property
    bool trading;          // New property

    CSession(string sym);
    bool IsInSession(datetime time) const;
    string GetSymbol();
    bool IsActive();
    void Activate();
    void Deactivate();
    void UpdateLevels(double high, double low);
    string toString();
    datetime CSession::GetDate() const;
};

CSession::CSession(string sym)
    : id(""), symbol(sym), name(""), startTime(0), endTime(0), isActive(false), sessionHigh(0), sessionLow(DBL_MAX), keyLevel(false), trading(false) {}

string CSession::toString() 
{
    string result = StringFormat("Session: ID=%s, Name=%s, Start=%s, End=%s, High=%f, Low=%f, KeyLevel=%s, Trading=%s",
        id, name, 
        CHelper::TimeToString(startTime), CHelper::TimeToString(endTime),
        sessionHigh, sessionLow,
        keyLevel ? "true" : "false",
        trading ? "true" : "false");
    
    return result;
}

datetime CSession::GetDate() const 
{ 
   return startTime; 
}

bool CSession::IsInSession(datetime time) const
{
    return (time >= startTime && time < endTime);
}

string CSession::GetSymbol()
{
    return symbol;
}

bool CSession::IsActive() 
{
    return isActive;
}

void CSession::Activate()
{
    isActive = true;
}

void CSession::Deactivate()
{
    isActive = false;
}

void CSession::UpdateLevels(double high, double low)
{
    if(high > sessionHigh) sessionHigh = high;
    if(low < sessionLow) sessionLow = low;
}

#endif

