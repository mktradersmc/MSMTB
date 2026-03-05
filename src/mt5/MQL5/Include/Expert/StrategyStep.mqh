//+------------------------------------------------------------------+
//|                                                 StrategyStep.mqh |
//|                                  Copyright 2023, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2023, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef STRATEGY_STEP_MQH
#define STRATEGY_STEP_MQH

#include <Object.mqh>
#include <Expert\Globals.mqh>
#include <Expert\Helper.mqh>
#include <Expert\ChartHelper.mqh>
#include <Expert\Event.mqh>
#include <Arrays/ArrayString.mqh>
#include <Expert\LogManager.mqh>
#include <Expert\ImbalanceStatusEvent.mqh>

class CStrategyStep : public CObject
{
private:
    CArrayString* m_eventNameTemplates;  // Array für multiple Event-Namen
    string m_originTimeframeTemplate;    // Timeframe-Referenz mit möglichen Parametern
    string m_targetTimeframeTemplate;    // Timeframe-Referenz mit möglichen Parametern
    string m_directionTemplate;          // Richtungs-Referenz mit möglichen Parametern
    int m_originTimeframe;               // Aufgelöster Timeframe
    int m_targetTimeframe;               // Aufgelöster Timeframe
    ENUM_MARKET_DIRECTION m_marketDirection;
    string m_description;
    int m_stepNumber;
    bool m_completed;
    bool m_hasUnmitigated;              // Neue Property für Unmitigated Flag
    bool m_unmitigatedRequired;         // Neue Property für Unmitigated Wert
    CArrayString* m_eventParamNames;    // Neue Event Parameter
    CArrayString* m_eventParamValues;   // Neue Event Parameter Werte
    bool m_isInvalidation;              // Neues Attribut für Invalidation

public:
    CStrategyStep();
    ~CStrategyStep();
    
    // Setter für Templates und direkte Werte
    void SetEventNameTemplates(const string& eventNamesStr); // Neue Methode für multiple Events
    void SetEventNameTemplate(const string& eventNameTemplate); // Bleibt für Abwärtskompatibilität
    string GetEventNameTemplate();
    void SetOriginTimeframe(const string& originTfTemplate);
    void SetTargetTimeframe(const string& targetTfTemplate);
    void SetDirection(const string& directionTemplate);
    void SetTimeframes(int origin, int target);
    void SetMarketDirection(ENUM_MARKET_DIRECTION direction);
    void SetDescription(const string &description);
    void SetStepNumber(int number);
    void SetCompleted(bool completed);
    void SetUnmitigated(bool required); 
    void SetEventParameter(const string name, const string value);
    string GetEventParameter(const string name) const;
    bool HasEventParameter(const string& name) const;
    string ResolveEventParameters(const string& name, const CArrayString* parameterNames, const CArrayString* parameterValues) const;
    void SetIsInvalidation(bool isInvalidation) { m_isInvalidation = isInvalidation; }
    bool IsInvalidation() { return m_isInvalidation; }

    // Parameter-Auflösung und Event-Matching
    bool MatchesEvent(CEvent* event, const CArrayString* parameterNames, const CArrayString* parameterValues) const;
    string ResolveParameters(const string inp, const CArrayString* parameterNames, const CArrayString* parameterValues) const;
    int ResolveTimeframe(const string timeframeStr) const;
    ENUM_MARKET_DIRECTION ResolveDirection(const string& directionStr) const;
    
    // Getter
    int GetEventNameCount() const { return m_eventNameTemplates.Total(); }
    string GetEventName(int index, const CArrayString* parameterNames, const CArrayString* parameterValues) const;
    int GetOriginTimeframe() const { return m_originTimeframe; }
    int GetTargetTimeframe() const { return m_targetTimeframe; }
    int GetResolvedOriginTimeframe(const CArrayString* parameterNames, const CArrayString* parameterValues);
    int GetResolvedTargetTimeframe(const CArrayString* parameterNames, const CArrayString* parameterValues);
    
    ENUM_MARKET_DIRECTION GetMarketDirection() const { return m_marketDirection; }
    string GetDescription() const { return m_description; }
    int GetStepNumber() const { return m_stepNumber; }
    bool IsCompleted() const { return m_completed; }
    bool HasUnmitigatedFlag() const { return m_hasUnmitigated; }      // Neue Methode
    bool IsUnmitigatedRequired() const { return m_unmitigatedRequired; } // Neue Methode
    
    // Debug/Info
    string GetDetails(const CArrayString* parameterNames, const CArrayString* parameterValues) const;
    string ToString() const;
    
    // Klonen
    CStrategyStep* Clone() const;
};

// Constructor Erweiterung
CStrategyStep::CStrategyStep()
    : m_originTimeframeTemplate(""),
      m_targetTimeframeTemplate(""),
      m_directionTemplate(""),
      m_originTimeframe(-1),
      m_targetTimeframe(-1),
      m_marketDirection(MARKET_DIRECTION_NEUTRAL),
      m_description(""),
      m_stepNumber(0),
      m_completed(false),
      m_isInvalidation(false)
{
    m_eventNameTemplates = new CArrayString();
    m_eventParamNames = new CArrayString();
    m_eventParamValues = new CArrayString();
}

// Destructor Erweiterung
CStrategyStep::~CStrategyStep()
{
    delete m_eventNameTemplates;
    delete m_eventParamNames;
    delete m_eventParamValues;
}

void CStrategyStep::SetEventParameter(const string name, const string value)
{
    for(int i = 0; i < m_eventParamNames.Total(); i++)
    {
        if(m_eventParamNames.At(i) == name)
        {
            m_eventParamValues.Update(i, value);
            return;
        }
    }
    
    m_eventParamNames.Add(name);
    m_eventParamValues.Add(value);
}

string CStrategyStep::GetEventParameter(const string name) const
{
    for(int i = 0; i < m_eventParamNames.Total(); i++)
    {
        if(m_eventParamNames.At(i) == name)
            return m_eventParamValues.At(i);
    }
    return "";
}

bool CStrategyStep::HasEventParameter(const string& name) const
{
    for(int i = 0; i < m_eventParamNames.Total(); i++)
    {
        if(m_eventParamNames.At(i) == name)
            return true;
    }
    return false;
}

string CStrategyStep::ResolveEventParameters(const string& name, const CArrayString* parameterNames, const CArrayString* parameterValues) const
{
    string value = GetEventParameter(name);
    if(value == "")
        return "";
        
    return ResolveParameters(value, parameterNames, parameterValues);
}

// Bestehende Clone-Methode erweitern
CStrategyStep* CStrategyStep::Clone() const
{
    CStrategyStep* clone = new CStrategyStep();
    
    // Copy event name templates
    for(int i = 0; i < m_eventNameTemplates.Total(); i++)
    {
        clone.m_eventNameTemplates.Add(m_eventNameTemplates.At(i));
    }
    
    // Copy event parameters
    for(int i = 0; i < m_eventParamNames.Total(); i++)
    {
        clone.SetEventParameter(m_eventParamNames.At(i), m_eventParamValues.At(i));
    }
    
    clone.m_originTimeframeTemplate = m_originTimeframeTemplate;
    clone.m_targetTimeframeTemplate = m_targetTimeframeTemplate;
    clone.m_directionTemplate = m_directionTemplate;
    clone.m_originTimeframe = m_originTimeframe;
    clone.m_targetTimeframe = m_targetTimeframe;
    clone.m_marketDirection = m_marketDirection;
    clone.m_unmitigatedRequired = m_unmitigatedRequired;
    clone.m_hasUnmitigated = m_hasUnmitigated;
    clone.m_description = m_description;
    clone.m_stepNumber = m_stepNumber;
    clone.m_completed = m_completed;
    clone.m_isInvalidation = m_isInvalidation;
    
    return clone;
}

void CStrategyStep::SetEventNameTemplates(const string& eventNamesStr)
{
    string cleanedStr = eventNamesStr;   
    string eventNames[];
    StringSplit(cleanedStr, '|', eventNames);

    CLogManager::GetInstance().LogMessage("CStrategyStep::SetEventNameTemplates",LL_DEBUG,
        StringFormat("Input string: '%s', Found events: %d", eventNamesStr, ArraySize(eventNames)));

    m_eventNameTemplates.Clear();
    for(int i = 0; i < ArraySize(eventNames); i++)
    {
        string trimmedEvent = CHelper::TrimString(eventNames[i]);
        CLogManager::GetInstance().LogMessage("CStrategyStep::SetEventNameTemplates",LL_DEBUG,
            StringFormat("Adding event %d: '%s'", i+1, trimmedEvent));
        m_eventNameTemplates.Add(trimmedEvent);
    }
}

void CStrategyStep::SetEventNameTemplate(const string& eventNameTemplate)
{
    m_eventNameTemplates.Clear();
    if(eventNameTemplate != "")
        SetEventNameTemplates(eventNameTemplate);
}

string CStrategyStep::GetEventNameTemplate()  
{
    string result = "";
    
    // Füge alle Events mit OR verknüpft zusammen
    for(int i = 0; i < m_eventNameTemplates.Total(); i++)
    {
        if(i > 0) result += " | ";
        result += m_eventNameTemplates.At(i);
    }
        
    return result;
}

void CStrategyStep::SetOriginTimeframe(const string& originTfTemplate)
{
    m_originTimeframeTemplate = originTfTemplate;
    m_originTimeframe = -1;  // Reset bis zur Parameter-Auflösung
}

void CStrategyStep::SetTargetTimeframe(const string& targetTfTemplate)
{
    m_targetTimeframeTemplate = targetTfTemplate;
    m_targetTimeframe = -1;  // Reset bis zur Parameter-Auflösung
}

void CStrategyStep::SetDirection(const string& directionTemplate)
{
    m_directionTemplate = directionTemplate;
    m_marketDirection = MARKET_DIRECTION_NEUTRAL;  // Reset bis zur Parameter-Auflösung
}

void CStrategyStep::SetTimeframes(int origin, int target)
{
    m_originTimeframe = origin;
    m_targetTimeframe = target;
    m_originTimeframeTemplate = "";  // Clear templates
    m_targetTimeframeTemplate = "";
}

void CStrategyStep::SetMarketDirection(ENUM_MARKET_DIRECTION direction)
{
    m_marketDirection = direction;
    m_directionTemplate = "";  // Clear template
}

void CStrategyStep::SetDescription(const string &description)
{
    m_description = description;
}

void CStrategyStep::SetStepNumber(int number)
{
    m_stepNumber = number;
}

void CStrategyStep::SetCompleted(bool completed)
{
    m_completed = completed;
}

string CStrategyStep::ResolveParameters(const string inp, const CArrayString* parameterNames, const CArrayString* parameterValues) const
{
    if(parameterNames == NULL || parameterValues == NULL || inp == "")
        return inp;
        
    string result = inp;
    
    for(int i = 0; i < parameterNames.Total(); i++)
    {
        string placeholder = "${" + parameterNames.At(i) + "}";
        StringReplace(result, placeholder, parameterValues.At(i));
    }
    
    return result;
}

string CStrategyStep::GetEventName(int index, const CArrayString* parameterNames, const CArrayString* parameterValues) const
{
    if(index < 0 || index >= m_eventNameTemplates.Total()) 
        return "";
    return ResolveParameters(m_eventNameTemplates.At(index), parameterNames, parameterValues);
}

bool CStrategyStep::MatchesEvent(CEvent* event, const CArrayString* parameterNames, const CArrayString* parameterValues) const
{
    if(event == NULL)
        return false;
    
    CLogManager::GetInstance().LogMessage("CStrategyStep::MatchesEvent",LL_DEBUG,
        StringFormat("Matching event '%s' against %d templates", 
            event.GetEventName(), 
            m_eventNameTemplates.Total()));
    
    // Prüfe ob einer der Event-Namen matched
    bool eventNameMatched = false;
    for(int i = 0; i < m_eventNameTemplates.Total(); i++)
    {
        string resolvedEventName = ResolveParameters(m_eventNameTemplates.At(i), parameterNames, parameterValues);
        CLogManager::GetInstance().LogMessage("CStrategyStep::MatchesEvent",LL_DEBUG,
            StringFormat("Checking template %d: Original='%s', Resolved='%s' against event '%s'", 
                i+1,
                m_eventNameTemplates.At(i),
                resolvedEventName,
                event.GetEventName()));
                
        if(event.GetEventName() == resolvedEventName)
        {
            eventNameMatched = true;
            CLogManager::GetInstance().LogMessage("CStrategyStep::MatchesEvent",LL_DEBUG,
                "Event name matched!");
            break;
        }
    }
    
    if(!eventNameMatched)
    {
        CLogManager::GetInstance().LogMessage("CStrategyStep::MatchesEvent",LL_DEBUG,
            "No matching event name found");
        return false;
    }
    
    CLogManager::GetInstance().LogMessage("CStrategyStep::MatchesEvent",LL_DEBUG,"Check Event: "+event.toString());
    
    // Löse und prüfe Origin Timeframe
    if(m_originTimeframeTemplate != "")
    {
        string resolvedTimeframe = ResolveParameters(m_originTimeframeTemplate, parameterNames, parameterValues);
        int timeframe = ResolveTimeframe(resolvedTimeframe);
        CLogManager::GetInstance().LogMessage("CStrategyStep::MatchesEvent",LL_DEBUG,"Resolved Original Timeframe = "+resolvedTimeframe);
    
        if(timeframe != -1 && event.GetOriginTimeframe() != timeframe)
            return false;
    }
    else if(m_originTimeframe != -1 && event.GetOriginTimeframe() != m_originTimeframe)
    {
        return false;
    }
    
    // Löse und prüfe Target Timeframe
    if(m_targetTimeframeTemplate != "")
    {
        string resolvedTimeframe = ResolveParameters(m_targetTimeframeTemplate, parameterNames, parameterValues);
        int timeframe = ResolveTimeframe(resolvedTimeframe);
        CLogManager::GetInstance().LogMessage("CStrategyStep::MatchesEvent",LL_DEBUG,"Resolved Target Timeframe = "+resolvedTimeframe);
        if(timeframe != -1)
        {
            int eventTargetTf = event.GetTargetTimeframe();
            if(eventTargetTf != 0 && eventTargetTf != timeframe)
                return false;
        }
    }
    else if(m_targetTimeframe != -1)
    {
        int eventTargetTf = event.GetTargetTimeframe();
        if(eventTargetTf != 0 && eventTargetTf != m_targetTimeframe)
            return false;
    }
    
    // Löse und prüfe Market Direction
    if(m_directionTemplate != "")
    {
        string resolvedDirection = ResolveParameters(m_directionTemplate, parameterNames, parameterValues);
        CLogManager::GetInstance().LogMessage("CStrategyStep::MatchesEvent",LL_DEBUG,"Resolved Market Direction = "+resolvedDirection);
        ENUM_MARKET_DIRECTION direction = ResolveDirection(resolvedDirection);
        if(direction != MARKET_DIRECTION_NEUTRAL && event.GetMarketDirection() != direction)
            return false;
    }
    else if(m_marketDirection != MARKET_DIRECTION_NEUTRAL && event.GetMarketDirection() != m_marketDirection)
    {
        return false;
    }
    
    CLogManager::GetInstance().LogMessage("CStrategyStep::MatchesEvent",LL_DEBUG,"Unmitigated Property Set = "+m_hasUnmitigated);
    
    // Prüfe Unmitigated Flag wenn gesetzt
    if(m_hasUnmitigated)
    {
        CImbalanceStatusEvent* imbalanceEvent = (CImbalanceStatusEvent*)event;
        CLogManager::GetInstance().LogMessage("CStrategyStep::MatchesEvent",LL_DEBUG,"Unmitigated Required = "+m_unmitigatedRequired+", Imbalance Unmitigated? "+imbalanceEvent.IsUnmitigated());
    
        if(imbalanceEvent == NULL || (imbalanceEvent.IsUnmitigated() == false && m_unmitigatedRequired))
            return false;
    }
    
    return true;
}

int CStrategyStep::GetResolvedOriginTimeframe(const CArrayString* parameterNames, const CArrayString* parameterValues)
{
    if(m_originTimeframeTemplate != "")
    {
        string resolvedTimeframe = ResolveParameters(m_originTimeframeTemplate, parameterNames, parameterValues);
        int timeframe = ResolveTimeframe(resolvedTimeframe);
        CLogManager::GetInstance().LogMessage("CStrategyStep::MatchesEvent",LL_DEBUG,"Resolved Original Timeframe = "+resolvedTimeframe);
    
        return timeframe;
    }
    
    return -1;
}

int CStrategyStep::GetResolvedTargetTimeframe(const CArrayString* parameterNames, const CArrayString* parameterValues)
{
    if(m_targetTimeframeTemplate != "")
    {
        string resolvedTimeframe = ResolveParameters(m_targetTimeframeTemplate, parameterNames, parameterValues);
        int timeframe = ResolveTimeframe(resolvedTimeframe);
        CLogManager::GetInstance().LogMessage("CStrategyStep::GetResolvedTargetTimeframe",LL_DEBUG,"Resolved Target Timeframe = "+resolvedTimeframe);
    
        return timeframe;
    }
    
    return -1;
}

void CStrategyStep::SetUnmitigated(bool required)
{
    m_hasUnmitigated = true;
    m_unmitigatedRequired = required;
}

int CStrategyStep::ResolveTimeframe(const string timeframeStr) const
{
    return CChartHelper::StringToTimeframe(timeframeStr);
}

ENUM_MARKET_DIRECTION CStrategyStep::ResolveDirection(const string& directionStr) const
{
    if(directionStr == "BULLISH") return MARKET_DIRECTION_BULLISH;
    if(directionStr == "BEARISH") return MARKET_DIRECTION_BEARISH;
    return MARKET_DIRECTION_NEUTRAL;
}

string CStrategyStep::GetDetails(const CArrayString* parameterNames, const CArrayString* parameterValues) const
{
   string result = "";
   
   result += "(";
   
   // Event Names mit aufgelösten Parametern
   for(int i = 0; i < m_eventNameTemplates.Total(); i++)
   {
       if(i > 0) result += " OR ";
       result += ResolveParameters(m_eventNameTemplates.At(i), parameterNames, parameterValues);
   }
   result += ")";
   
   // Origin Timeframe
   if(m_originTimeframeTemplate != "")
   {
       string resolvedTf = ResolveParameters(m_originTimeframeTemplate, parameterNames, parameterValues);
       result += " (Origin TF: " + resolvedTf;
   }
   else
   {
       result += " (Origin TF: " + CChartHelper::GetTimeframeName(m_originTimeframe);
   }
   
   // Target Timeframe
   if(m_targetTimeframeTemplate != "")
   {
       string resolvedTf = ResolveParameters(m_targetTimeframeTemplate, parameterNames, parameterValues);
       result += ", Target TF: " + resolvedTf;
   }
   else if(m_targetTimeframe != -1)
   {
       result += ", Target TF: " + CChartHelper::GetTimeframeName(m_targetTimeframe);
   }
   
   // Market Direction
   if(m_directionTemplate != "")
   {
       string resolvedDir = ResolveParameters(m_directionTemplate, parameterNames, parameterValues);
       result += ", Market Direction: " + resolvedDir;
   }
   else
   {
       result += ", Market Direction: " + EnumToString(m_marketDirection);
   }
   
   // Unmitigated Flag
   if(m_hasUnmitigated)
   {
       result += ", Unmitigated: " + m_unmitigatedRequired;
   }

   // Event Parameter
   for(int i = 0; i < m_eventParamNames.Total(); i++)
   {
       string paramName = m_eventParamNames.At(i);
       string paramValue = m_eventParamValues.At(i);
       
       // Parameter-Wert auflösen falls es ein Template ist
       string resolvedValue = ResolveParameters(paramValue, parameterNames, parameterValues);
       result += ", " + paramName + ": " + resolvedValue;
   }

   result += ")";
   return result;
}

string CStrategyStep::ToString() const
{
    string result = "Step " + IntegerToString(m_stepNumber) + ": ";
    if(m_description != "")
        result += m_description + "\n ";
        
    result += GetDetails(NULL, NULL);  // Ohne Parameter-Auflösung
    return result;
}

#endif


