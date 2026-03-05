//+------------------------------------------------------------------+
//|                                                   LogManager.mqh |
//|                                  Copyright 2023, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef LOG_MANAGER_MQH
#define LOG_MANAGER_MQH

#include <Object.mqh>
#include <Expert\Event.mqh>
#include <Expert\ChartHelper.mqh>
#include <Arrays\ArrayInt.mqh>
#include <Arrays\ArrayObj.mqh>
#include <Files/FileTxt.mqh>

const int LL_ERROR = 0;
const int LL_INFO = 1;
const int LL_DEBUG = 2;

input group "Log Debug Settings";
input int InpActiveLogLevel = 0; // Log Level für Kategorielogging 0 = ERROR, 1 = INFO, 2 = DEBUG
input string log_categories = ""; // Zu loggende Kategorien
input bool InpForceLogAll = false; // Erzwingt die Ausgabe aller Events

class CEvent;

class CEventFilter : public CObject
{
private:
    string m_eventName;
    CArrayInt* m_originalTimeframes;
    CArrayInt* m_targetTimeframes;

public:
    CEventFilter(string eventName) : m_eventName(eventName)
    {
        m_originalTimeframes = new CArrayInt();
    }

    ~CEventFilter()
    {
        delete m_originalTimeframes;
        delete m_targetTimeframes;
    }

    string GetEventName() const { return m_eventName; }

    string toString() 
    {
        string result = "Event-Log Filter for Event "+GetEventName()+" on Timeframes ";
        for (int i=0; i<m_originalTimeframes.Total();i++)
        {
           if (i>0)
           result += ", ";
           result += CChartHelper::GetTimeframeName(m_originalTimeframes[i]);
        }
        return result;
    }
    
    void AddOriginalTimeframe(int timeframe)
    {
        m_originalTimeframes.Add(timeframe);
    }

    bool ContainsTimeframe(int timeframe) const
    {
        if (timeframe == 0)
            return true;
        for(int i = 0; i < m_originalTimeframes.Total(); i++)
        {
            if(m_originalTimeframes.At(i) == timeframe)
                return true;
        }
        return false;
    }
};

class CLogManager
{
private:
    static CLogManager* instance;
    CArrayObj m_eventFilters;

    CLogManager() {}
    bool ShouldLogForCategory(const string& classname);

public:
    static CLogManager* GetInstance();
    void LogMessage(string classname, int level, string message);
    void LogEvent(CEvent* event);
    bool ShouldLogEvent(CEvent* event);
    void LoadConfiguration(string filename);

private:
    void ParseConfigLine(string line);
};

CLogManager* CLogManager::instance = NULL;

CLogManager* CLogManager::GetInstance()
{
    if (instance == NULL)
        instance = new CLogManager();
    return instance;
}

bool CLogManager::ShouldLogForCategory(const string& classname)
{
    if(StringLen(log_categories) == 0)
        return false;
        
    string categories[];
    StringSplit(log_categories, ',', categories);
    
    for(int i = 0; i < ArraySize(categories); i++)
    {
        string category = CHelper::TrimString(categories[i]);
        if(category == "") continue;
        
        if(StringFind(classname, category) != -1)
        {
            return true;
        }
    }
    
    return false;
}

void CLogManager::LogMessage(string classname, int level, string message)
{
    if(level <= InpActiveLogLevel && ShouldLogForCategory(classname))
    {
        Print(message);            
    }
}

void CLogManager::LogEvent(CEvent* event)
{
    if (ShouldLogEvent(event) && InpActiveLogLevel >= LL_INFO)
        Print(event.GetDetails());
}

bool CLogManager::ShouldLogEvent(CEvent* event)
{
    string eventName = event.GetEventName();
    int originTimeframe = event.GetOriginTimeframe();
    
    for (int i = 0; i < m_eventFilters.Total(); i++)
    {
        CEventFilter* filter = m_eventFilters.At(i);
        if (filter.GetEventName() == eventName)
        {
            return filter.ContainsTimeframe(originTimeframe);
        }
    }
    return InpForceLogAll;
}

void CLogManager::LoadConfiguration(string filename)
{
    m_eventFilters.Clear();
    CFileTxt file;
    
    Print("Loading "+filename);
    int fileHandle = FileOpen(filename, FILE_TXT|FILE_READ|FILE_ANSI,0,CP_UTF8);
    if (fileHandle == INVALID_HANDLE)
    {
        Print("Error opening file "+filename+": ", GetLastError());
        return;
    }
     
    string content = "";
    string line;
    
    while(!FileIsEnding(fileHandle))
    {
       line = FileReadString(fileHandle);
       ParseConfigLine(line);
    }
     
    FileClose(fileHandle);  
}

void CLogManager::ParseConfigLine(string line)
{
    Print(line);  
    line = CHelper::TrimString(line);
    
    if (StringLen(line) == 0)
        return;
    
    if (StringGetCharacter(line, 0) == '#')
    {
        return;
    }

    string parts[];
    StringSplit(line, ':', parts);
    if (ArraySize(parts) == 2)
    {
        string eventName = CHelper::TrimString(parts[0]);
        string timeframesStr = CHelper::TrimString(parts[1]);
        
        CEventFilter* filter = new CEventFilter(eventName);

        string timeframes[];
        StringSplit(timeframesStr, ',', timeframes);
        for (int i = 0; i < ArraySize(timeframes); i++)
        {
            string tf = CHelper::TrimString(timeframes[i]);
            int timeframe = CChartHelper::StringToTimeframe(tf);
            if (timeframe != 0)
                filter.AddOriginalTimeframe(timeframe);
        }
        
        m_eventFilters.Add(filter);
    }
    else
    {
        Print("Invalid configuration line: ", line);
    }
}

#endif


