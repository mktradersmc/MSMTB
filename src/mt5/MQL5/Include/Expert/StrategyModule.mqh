#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property strict

#ifndef STRATEGY_MODULE_MQH
#define STRATEGY_MODULE_MQH

#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Arrays/ArrayString.mqh>
#include <Expert\StrategyStep.mqh>
#include <Expert\ModuleState.mqh>
#include <Expert\ModuleTypes.mqh>

class CStrategyModule : public CObject
{
private:
    string m_name;                    // Name des Moduls
    string m_moduleType;              // Typ des Moduls (Setup, Entry, Invalidation)
    CArrayString* m_parameterNames;   // Namen der Parameter
    CArrayString* m_parameterValues;  // Aktuelle Werte der Parameter
    CArrayObj* m_steps;              // Liste der Steps

public:
    CStrategyModule(const string& name, const string moduleType = MODULE_TYPE_SETUP);
    ~CStrategyModule();
    
    // Parameter-Management
    void AddParameter(const string paramName);
    void AddParameterValue(const string paramName);
    string GetParameterValue(const string paramName) const;
    void GetParameterNames(string &names[]) const;
    CArrayString* GetParameterNames() const { return m_parameterNames; }
    CArrayString* GetParameterValues() const { return m_parameterValues; }
    bool ValidateParameters() const;
    int GetParameterCount() const { return m_parameterNames.Total(); }
    
    // Step-Management
    void AddStep(CStrategyStep* step);
    int GetStepCount() const { return m_steps.Total(); }
    CStrategyStep* GetStep(int index) const;
        
    // Event-Processing
    bool ProcessEvents(const CArrayObj* events, CModuleState* state);
    
    // Getter
    string GetName() const { return m_name; }
    string GetModuleType() const { return m_moduleType; }
    void SetModuleType(string type) { m_moduleType=type; }
    bool IsModuleType(const string& type) const { return m_moduleType == type; }
    
    // Modul-Erstellung
    CStrategyModule* Clone() const;
    string ToString() const;
};

CStrategyModule::CStrategyModule(const string& name, const string moduleType = MODULE_TYPE_SETUP)
{
    m_name = name;
    m_moduleType = moduleType;
    
    if(!CModuleTypes::IsValidModuleType(moduleType))
    {
        Print("Warning: Invalid module type '", moduleType, "' for module '", name, "'");
    }
    
    m_parameterNames = new CArrayString();
    m_parameterValues = new CArrayString();
    m_steps = new CArrayObj();
}

CStrategyModule::~CStrategyModule()
{
    if(CheckPointer(m_parameterNames) == POINTER_DYNAMIC)
        delete m_parameterNames;
    
    if(CheckPointer(m_parameterValues) == POINTER_DYNAMIC)
        delete m_parameterValues;
    
    // Cleanup steps
    if(CheckPointer(m_steps) == POINTER_DYNAMIC)
    {
        for(int i = 0; i < m_steps.Total(); i++)
        {
            if(CheckPointer(m_steps.At(i)) == POINTER_DYNAMIC)
                delete m_steps.At(i);
        }
        delete m_steps;
    }
}

void CStrategyModule::AddParameter(const string paramName)
{
    m_parameterNames.Add(paramName);
}

void CStrategyModule::AddParameterValue(const string value)
{
   m_parameterValues.Add(value);      
}

string CStrategyModule::GetParameterValue(const string paramName) const
{
    for(int i = 0; i < m_parameterNames.Total(); i++)
    {
        if(m_parameterNames.At(i) == paramName)
            return m_parameterValues.At(i);
    }
    return "";
}

void CStrategyModule::GetParameterNames(string &names[]) const
{
    ArrayResize(names, m_parameterNames.Total());
    for(int i = 0; i < m_parameterNames.Total(); i++)
    {
        names[i] = m_parameterNames.At(i);
    }
}

bool CStrategyModule::ValidateParameters() const
{
    // Prüfe, ob alle Parameter einen Wert haben
    for(int i = 0; i < m_parameterNames.Total(); i++)
    {
        if(m_parameterValues.At(i) == "")
        {
            Print("Error: Parameter '", m_parameterNames.At(i), "' in module '", m_name, "' has no value");
            return false;
        }
    }
    return true;
}

void CStrategyModule::AddStep(CStrategyStep* step)
{
    m_steps.Add(step);
}

CStrategyStep* CStrategyModule::GetStep(int index) const
{
    if(index >= 0 && index < m_steps.Total())
        return m_steps.At(index);
    return NULL;
}

bool CStrategyModule::ProcessEvents(const CArrayObj* events, CModuleState* state)
{
    if(events == NULL || state == NULL) return false;
    
    // Prüfe zuerst, ob alle Parameter gesetzt sind
    if(!ValidateParameters())
    {
        Print("Error: Cannot process events - invalid parameters in module '", m_name, "'");
        return false;
    }
    
    bool moduleUpdated = false;
    
    // Verarbeite jeden Step in Reihenfolge
    for(int i = 0; i < m_steps.Total(); i++)
    {
        // Überspringe bereits abgeschlossene Steps
        if(state.IsStepCompleted(i))
            continue;
            
        CStrategyStep* step = m_steps.At(i);
        
        // Gehe rückwärts durch die Events (neueste zuerst)
        for(int j = events.Total() - 1; j >= 0; j--)
        {
            CEvent* event = events.At(j);
            // Übergebe die Parameter-Werte an den Step für das Matching
            if(step.MatchesEvent(event, m_parameterNames, m_parameterValues))
            {
                state.SetStepCompleted(i, event);
                moduleUpdated = true;
                break;
            }
        }
        
        // Wenn dieser Step nicht completed wurde, können wir aufhören
        if(!state.IsStepCompleted(i))
            break;
    }
    
    return moduleUpdated;
}

CStrategyModule* CStrategyModule::Clone() const
{
    CStrategyModule* clone = new CStrategyModule(m_name, m_moduleType);
    
    // Kopiere Parameter-Namen
    for(int i = 0; i < m_parameterNames.Total(); i++)
    {
        clone.AddParameter(m_parameterNames.At(i));
    }
    
    // Kopiere Parameter-Werte
    for(int i = 0; i < m_parameterValues.Total(); i++)
    {
        clone.AddParameterValue(m_parameterValues.At(i));
    }
    
    // Kopiere Steps
    for(int i = 0; i < m_steps.Total(); i++)
    {
        CStrategyStep* step = m_steps.At(i);
        clone.AddStep(step.Clone());
    }
    
    return clone;
}

string CStrategyModule::ToString() const
{
    string result = StringFormat("Module: %s (Type: %s)\n", m_name, m_moduleType);
    
    // Parameter
    result += "=============Parameters:\n";
    for(int i = 0; i < m_parameterNames.Total(); i++)
    {
        result += StringFormat("  %s = %s\n", 
            m_parameterNames.At(i), 
            m_parameterValues.At(i) == "" ? "[not set]" : m_parameterValues.At(i));
    }
    
    // Events
    result += "Events:\n";
    for(int i = 0; i < m_steps.Total(); i++)
    {
        CStrategyStep* step = m_steps.At(i);
        string eventName = step.GetEventName(0, m_parameterNames, m_parameterValues);
        
        // Berücksichtige ob es eine Invalidierung ist
        string stepType = step.IsInvalidation() ? "Invalidation" : "Event";
        result += StringFormat("      %s %d: %s\n", stepType, i+1, eventName);
        result += StringFormat("         Template: %s\n", step.GetEventNameTemplate());
        result += StringFormat("         Details: %s\n", step.GetDetails(m_parameterNames, m_parameterValues));
    }
    
    return result;
}

#endif


