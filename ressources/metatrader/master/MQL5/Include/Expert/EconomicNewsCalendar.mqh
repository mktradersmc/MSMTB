//+------------------------------------------------------------------+
//|                                         EconomicNewsCalendar.mqh |
//|                                   Copyright 2023, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, Michael Müller"
#property link      "https://www.mql5.com"
#property version   "1.04"
#property strict

#ifndef NEWSCALENDAR_MQH
#define NEWSCALENDAR_MQH

#include <Object.mqh>
#include <Arrays\ArrayObj.mqh>
#include <Expert\EconomicEvent.mqh>

input string news_calendar_filename; // Dateiname mit Economic News Einträgen

// Hauptklasse für den Wirtschaftskalender
// CEconomicNewsCalendar Class Definition
class CEconomicNewsCalendar : public CObject
{
private:
    CArrayObj* events;
    static CEconomicNewsCalendar* instance;
   
    int ParseImpactString(string impactString);
    void ReadEconomicEvents(string fileName);
    int GetDateInt(datetime date);
   
public:
    CEconomicNewsCalendar();
    ~CEconomicNewsCalendar();
   
    static CEconomicNewsCalendar* GetInstance();
    void LoadCalendar();
    CArrayObj* GetEconomicEvents(string symbol, datetime day, int impact);
};

// CEconomicNewsCalendar Class Implementation
CEconomicNewsCalendar* CEconomicNewsCalendar::instance = NULL;

CEconomicNewsCalendar::CEconomicNewsCalendar()
{
    events = new CArrayObj;
}

CEconomicNewsCalendar::~CEconomicNewsCalendar()
{
    for(int i=events.Total()-1; i>=0; i--)
    {
        delete events.At(i);
    }
    delete events;
}

CEconomicNewsCalendar* CEconomicNewsCalendar::GetInstance()
{
    if (instance == NULL) {
        instance = new CEconomicNewsCalendar();
    }
    return instance;
}

int CEconomicNewsCalendar::GetDateInt(datetime date)
{
    MqlDateTime dt;
    TimeToStruct(date, dt);
    return dt.year * 10000 + dt.mon * 100 + dt.day;
}

CArrayObj* CEconomicNewsCalendar::GetEconomicEvents(string symbol, datetime day, int impact)
{
    CArrayObj* filteredEvents = new CArrayObj;

    int searchDay = GetDateInt(day);

    for (int i=0; i < events.Total(); i++)
    {
        CEconomicEvent* event = events.At(i);
        int eventDay = GetDateInt(event.time);

        if (eventDay == searchDay)
        {
            if (StringSubstr(symbol,0,3) == event.currency || StringSubstr(symbol,3,3) == event.currency)
            {
                if (event.impact == impact)
                {
                    Print("Relevantes News-Event: "+event.toString());
                    filteredEvents.Add(event);
                }
            }
        }
    }

    return filteredEvents;
}

int CEconomicNewsCalendar::ParseImpactString(string impactString)
{
    if (StringFind(impactString, "Low") == 0)
        return 1;
    else if (StringFind(impactString, "Medium") == 0)
        return 2;
    else if (StringFind(impactString, "High") == 0)
        return 3;
    else
        return 0; // Unknown impact
}

void CEconomicNewsCalendar::ReadEconomicEvents(string filename)
{
    Print("Loading "+filename);
    int fileHandle = FileOpen(filename, FILE_CSV|FILE_READ, ',');
    if (fileHandle == INVALID_HANDLE)
    {
        Print("Error opening file "+filename+": ", GetLastError());
        return;
    }

    int lines = 0;
    while (!FileIsEnding(fileHandle))
    {
        string name = FileReadString(fileHandle);
        if (name == "" || StringSubstr(name, 0, 1) == "#") // Skip empty lines or comments
        {
            FileReadString(fileHandle); // Skip rest of the line
            continue;
        }
        
        datetime time = (datetime)StringToInteger(FileReadString(fileHandle));
        string country = FileReadString(fileHandle);
        string currency = FileReadString(fileHandle);
        string impactString = FileReadString(fileHandle);
   
        int impact = ParseImpactString(impactString);
   
        CEconomicEvent* event = new CEconomicEvent(name, time, country, currency, impact);
        events.Add(event);
        
        lines++;
    }

    Print(lines+" lines of news events read from file "+filename);
    FileClose(fileHandle);
}

void CEconomicNewsCalendar::LoadCalendar()
{
    if (news_calendar_filename != "")
    {
        for(int i=events.Total()-1; i>=0; i--)
        {
            delete events.At(i);
            events.Delete(i);
        }
      
        ReadEconomicEvents(news_calendar_filename);
   
        for (int i = 0; i < events.Total(); i++)
        {
            CEconomicEvent* event = events.At(i);
            //Print(event.toString());      
        }
    }
    else 
    {
        Print("No filename provided for the news calendar");
    }
}

#endif


