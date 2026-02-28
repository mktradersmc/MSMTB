//+------------------------------------------------------------------+
//|                                                       Helper.mqh |
//|                                   Copyright 2022, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2022, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.03"
#property strict

#ifndef HELPER_MQH
#define HELPER_MQH

#include <Expert\Globals.mqh>
#include <Object.mqh>
#include <Expert\EnvironmentManager.mqh>

input group "Broker Settings"

class CHelper : public CObject 
{ 
public:
   CHelper();
   ~CHelper();
   static datetime GetDateForToday(string time);
   static string TimeToString(datetime time);
   static string TimeToDayString(datetime time);
   static string TrimString(string str);
   static datetime NormalizeDate(datetime dt);
   static datetime GetDateForToday(datetime time);
   static datetime GetDateForDay(datetime day, datetime time);
};
   

// CHelper Class Implementation
CHelper::CHelper() {}
CHelper::~CHelper() {}

class CEnvironmentManager;

string CHelper::TrimString(string str)
{
   #ifdef __MQL4__
      str = StringTrimLeft(str);
      str = StringTrimRight(str);
   #else
      StringTrimLeft(str);
      StringTrimRight(str);
   #endif
   return str;
}

datetime CHelper::GetDateForToday(string time)
{
   MqlDateTime dt;
   TimeCurrent(dt);
   string today = StringFormat("%04d.%02d.%02d", dt.year, dt.mon, dt.day);
   return StringToTime(today + " " + time);
}

datetime CHelper::GetDateForToday(datetime time) 
{
    datetime currentTime = TimeCurrent();  

    MqlDateTime currentTimeStruct;
    TimeCurrent(currentTimeStruct);

    MqlDateTime mergeTimeStruct;
    TimeToStruct(time, mergeTimeStruct); 

    currentTimeStruct.hour = mergeTimeStruct.hour;
    currentTimeStruct.min = mergeTimeStruct.min;
    currentTimeStruct.sec = mergeTimeStruct.sec;

    return StructToTime(currentTimeStruct);
}


datetime CHelper::GetDateForDay(datetime day, datetime time) 
{
    datetime currentTime = TimeCurrent();  

    MqlDateTime currentTimeStruct;
    TimeToStruct(day, currentTimeStruct); 

    MqlDateTime mergeTimeStruct;
    TimeToStruct(time, mergeTimeStruct); 

    currentTimeStruct.hour = mergeTimeStruct.hour;
    currentTimeStruct.min = mergeTimeStruct.min;
    currentTimeStruct.sec = mergeTimeStruct.sec;

    return StructToTime(currentTimeStruct);
}

datetime CHelper::NormalizeDate(datetime dt) {
    return dt - (dt % 86400);
}

string CHelper::TimeToString(datetime time)
{
   #ifdef __MQL5__
      return ::TimeToString(time, TIME_DATE|TIME_MINUTES|TIME_SECONDS);
   #else
      return TimeToStr(time, TIME_DATE|TIME_MINUTES|TIME_SECONDS);
   #endif
}


string CHelper::TimeToDayString(datetime time)
{
   #ifdef __MQL5__
      return ::TimeToString(time, TIME_DATE);
   #else
      return TimeToStr(time, TIME_DATE);
   #endif
}

#endif // HELPER_MQH


