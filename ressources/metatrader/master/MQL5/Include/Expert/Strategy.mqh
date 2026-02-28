//+------------------------------------------------------------------+
//|                                                     Strategy.mqh |
//|                                   Copyright 2024, Michael Müller |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property strict

#ifndef STRATEGY_MQH
#define STRATEGY_MQH

#include <Object.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Expert\StrategyModule.mqh>
#include <Expert\ModuleState.mqh>
#include <Expert\Event.mqh>
#include <Expert\ValidationCondition.mqh>
#include <Expert\ModuleTypes.mqh>
#include <Expert\StrategyStep.mqh>

class CStrategyModule;
class CStrategyStep;

class CModuleData : public CObject
{
public:
    CStrategyModule* module;
    CModuleState* state;
    CArrayObj* events;
    bool isLong;
  
    CModuleData() : module(NULL), state(NULL), events(NULL), isLong(false) {}
      
    ~CModuleData() 
    {
        if(events != NULL)
        {    
            while(events.Total() > 0)
                events.Delete(0);
            delete events;
        }
    }
};

class CStrategy : public CObject
{
private:
    string m_name;
    string m_strategyText;
    CArrayObj* m_longModules;   // Array von CModuleData
    CArrayObj* m_shortModules;  // Array von CModuleData
    CArrayObj* m_longValidations;
    CArrayObj* m_shortValidations;

public:
    string Name;              // Für Kompatibilität beibehalten
    bool IsSignal;
    
    CStrategy();
    ~CStrategy();
    
    // Modul-Management Methoden
    void SetModule(CStrategyModule* module, bool isLong);
    CStrategyModule* GetModule(const string& moduleType, bool isLong) const;
    CModuleState* GetModuleState(const string& moduleType, bool isLong) const;
    CArrayObj* GetModuleEvents(const string& moduleType, bool isLong) const;
    
    // Kompatibilitätsmethoden
    void SetLongSetup(CStrategyModule* module) { SetModule(module, true); }
    void SetLongEntry(CStrategyModule* module) { SetModule(module, true); }
    void SetShortSetup(CStrategyModule* module) { SetModule(module, false); }
    void SetShortEntry(CStrategyModule* module) { SetModule(module, false); }
    
    CStrategyModule* GetLongSetup() const { return GetModule(MODULE_TYPE_SETUP, true); }
    CStrategyModule* GetLongEntry() const { return GetModule(MODULE_TYPE_ENTRY, true); }
    CStrategyModule* GetShortSetup() const { return GetModule(MODULE_TYPE_SETUP, false); }
    CStrategyModule* GetShortEntry() const { return GetModule(MODULE_TYPE_ENTRY, false); }
    
    CModuleState* GetLongSetupState() const { return GetModuleState(MODULE_TYPE_SETUP, true); }
    CModuleState* GetLongEntryState() const { return GetModuleState(MODULE_TYPE_ENTRY, true); }
    CModuleState* GetShortSetupState() const { return GetModuleState(MODULE_TYPE_SETUP, false); }
    CModuleState* GetShortEntryState() const { return GetModuleState(MODULE_TYPE_ENTRY, false); }
        
    void GetUsedModuleNames(string &moduleNames[]);

    // Validation-Management
    void SetLongValidations(CArrayObj* validations);
    void SetShortValidations(CArrayObj* validations);
    bool ValidateLongConditions() const;
    bool ValidateShortConditions() const;
    string GetLongValidationDetails() const;
    string GetShortValidationDetails() const;
    string GetLongValidationDescription() const;
    string GetShortValidationDescription() const;

    // Weitere Methoden
    string ToString();
    void ShowModuleEvents(CStrategyModule* module, string &result);
    bool HasLongStrategy() const;
    bool HasShortStrategy() const;
    bool IsLongCompleted() const;
    bool IsShortCompleted() const;
    int LongStepCount() const;
    int ShortStepCount() const;
    CStrategyStep* GetLongStep(int index) const;
    CStrategyStep* GetShortStep(int index) const;
    CStrategyStep* GetCurrentLongStep() const;
    CStrategyStep* GetCurrentShortStep() const;
    bool IsMacroStrategy() { return false; }
    
    // Event Management
    void AddLongEvent(CEvent* event);
    void AddShortEvent(CEvent* event);
    CArrayObj* GetLongEvents() const { return GetModuleEvents(MODULE_TYPE_ENTRY, true); }
    CArrayObj* GetShortEvents() const { return GetModuleEvents(MODULE_TYPE_ENTRY, false); }
    
    // Reset Funktionen
    void ResetLongExecution();
    void ResetShortExecution();
    void ResetLongEntry();
    void ResetShortEntry();
    void Reset();
    
    // Strategy Text
    void SetStrategyText(const string& text) { m_strategyText = text; }
    string GetStrategyText() const { return m_strategyText; }
};

CStrategy::CStrategy()
    : m_name(""), m_strategyText(""), IsSignal(false)
{
    m_longModules = new CArrayObj();
    m_shortModules = new CArrayObj();
    m_longValidations = new CArrayObj();
    m_shortValidations = new CArrayObj();
    Name = "";
}

CStrategy::~CStrategy()
{
    // Cleanup long modules
    for(int i = 0; i < m_longModules.Total(); i++)
    {
        CModuleData* data = m_longModules.At(i);
        if(data != NULL)
        {
            if(data.module != NULL) delete data.module;
            if(data.state != NULL) delete data.state;
            delete data;
        }
    }
    delete m_longModules;
    
    // Cleanup short modules
    for(int i = 0; i < m_shortModules.Total(); i++)
    {
        CModuleData* data = m_shortModules.At(i);
        if(data != NULL)
        {
            if(data.module != NULL) delete data.module;
            if(data.state != NULL) delete data.state;
            delete data;
        }
    }
    delete m_shortModules;
    
    // Cleanup validations
    if(m_longValidations != NULL)
    {
        for(int i = 0; i < m_longValidations.Total(); i++)
            delete m_longValidations.At(i);
        delete m_longValidations;
    }
    
    if(m_shortValidations != NULL)
    {
        for(int i = 0; i < m_shortValidations.Total(); i++)
            delete m_shortValidations.At(i);
        delete m_shortValidations;
    }
}

void CStrategy::SetModule(CStrategyModule* module, bool isLong)
{
    if(module == NULL)
        return;
        
    Print("Debug - Setting module: ", module.GetName(), " Type: ", module.GetModuleType(), " IsLong: ", isLong);  // Debug
    CArrayObj* modules = isLong ? m_longModules : m_shortModules;
    
    // Prüfe ob bereits ein Modul dieses Typs existiert
    for(int i = 0; i < modules.Total(); i++)
    {
        CModuleData* existingData = modules.At(i);
        Print("Debug - Existing module: ", existingData.module.GetName(), " Type: ", existingData.module.GetModuleType());  // Debug
        if(existingData.module.GetModuleType() == module.GetModuleType())
        {
            // Ersetze bestehendes Modul
            delete existingData.module;
            if(existingData.state != NULL) delete existingData.state;
            
            existingData.module = module;           
            existingData.state = new CModuleState(module);
            return;
        }
    }
    
    // Erstelle neue Modul-Daten
    CModuleData* moduleData = new CModuleData();
    moduleData.module = module;
    moduleData.isLong = isLong;
    moduleData.state = new CModuleState(module);
    moduleData.events = new CArrayObj();
    
    modules.Add(moduleData);
    Print("Debug - Added new module to strategy");  // Debug
}

CStrategyModule* CStrategy::GetModule(const string& moduleType, bool isLong) const
{
    CArrayObj* modules = isLong ? m_longModules : m_shortModules;
    
    for(int i = 0; i < modules.Total(); i++)
    {
        CModuleData* data = modules.At(i);
        if(data.module != NULL && data.module.GetModuleType() == moduleType)
            return data.module;
    }
    return NULL;
}

CModuleState* CStrategy::GetModuleState(const string& moduleType, bool isLong) const
{
    CArrayObj* modules = isLong ? m_longModules : m_shortModules;
    
    for(int i = 0; i < modules.Total(); i++)
    {
        CModuleData* data = modules.At(i);
        if(data.module != NULL && data.module.GetModuleType() == moduleType)
            return data.state;
    }
    return NULL;
}

CArrayObj* CStrategy::GetModuleEvents(const string& moduleType, bool isLong) const
{
    CArrayObj* modules = isLong ? m_longModules : m_shortModules;
    
    for(int i = 0; i < modules.Total(); i++)
    {
        CModuleData* data = modules.At(i);
        if(data.module != NULL && data.module.GetModuleType() == moduleType)
            return data.events;
    }
    return NULL;
}

void CStrategy::SetLongValidations(CArrayObj* validations)
{
    if(m_longValidations != NULL)
    {
        for(int i = 0; i < m_longValidations.Total(); i++)
            delete m_longValidations.At(i);
        delete m_longValidations;
    }
    
    m_longValidations = validations;
}

void CStrategy::SetShortValidations(CArrayObj* validations)
{
    if(m_shortValidations != NULL)
    {
        for(int i = 0; i < m_shortValidations.Total(); i++)
            delete m_shortValidations.At(i);
        delete m_shortValidations;
    }
    
    m_shortValidations = validations;
}

bool CStrategy::ValidateLongConditions() const
{
    if(m_longValidations == NULL)
        return true;
        
    for(int i = 0; i < m_longValidations.Total(); i++)
    {
        CValidationCondition* condition = m_longValidations.At(i);
        if(!condition.Validate())
            return false;
    }
    return true;
}

bool CStrategy::ValidateShortConditions() const
{
    if(m_shortValidations == NULL)
        return true;
        
    for(int i = 0; i < m_shortValidations.Total(); i++)
    {
        CValidationCondition* condition = m_shortValidations.At(i);
        if(!condition.Validate())
            return false;
    }
    return true;
}

string CStrategy::GetLongValidationDescription() const
{
    string result = "";
    if(m_longValidations != NULL)
    {
        for(int i = 0; i < m_longValidations.Total(); i++)
        {
            CValidationCondition* condition = m_longValidations.At(i);
            if(i > 0) result += "\n";
            result += condition.GetDescription();
        }
    }
    return result;
}

string CStrategy::GetShortValidationDescription() const
{
    string result = "";
    if(m_shortValidations != NULL)
    {
        for(int i = 0; i < m_shortValidations.Total(); i++)
        {
            CValidationCondition* condition = m_shortValidations.At(i);
            if(i > 0) result += "\n";
            result += condition.GetDescription();
        }
    }
    return result;
}

string CStrategy::GetLongValidationDetails() const
{
    string result = "";
    if(m_longValidations != NULL)
    {
        for(int i = 0; i < m_longValidations.Total(); i++)
        {
            CValidationCondition* condition = m_longValidations.At(i);
            if(i > 0) result += "\n";
            result += condition.GetDetails();
        }
    }
    return result;
}

string CStrategy::GetShortValidationDetails() const
{
    string result = "";
    if(m_shortValidations != NULL)
    {
        for(int i = 0; i < m_shortValidations.Total(); i++)
        {
            CValidationCondition* condition = m_shortValidations.At(i);
            if(i > 0) result += "\n";
            result += condition.GetDetails();
        }
    }
    return result;
}

string CStrategy::ToString()
{
    string result = "\nStrategy: " + Name + "\n";
    result += "====================================\n";
    
    Print("Debug - Strategy Modules:");
    for(int i = 0; i < m_longModules.Total(); i++)
    {
        CModuleData* data = m_longModules.At(i);
        if(data != NULL && data.module != NULL)
            Print("Long Module: ", data.module.GetName(), " Type: ", data.module.GetModuleType());
    }
    
    if(HasLongStrategy())
    {
        result += "LONG STRATEGY:\n";
        result += "------------------------------------\n";
        
        CStrategyModule* longSetup = GetModule(MODULE_TYPE_SETUP, true);
        if(longSetup != NULL)
        {
            result += "Setup Module: " + longSetup.GetName() + "\n";
            ShowModuleEvents(longSetup, result);
            result += "------------------------------------\n";
        }
        
        CStrategyModule* longEntry = GetModule(MODULE_TYPE_ENTRY, true);
        if(longEntry != NULL)
        {
            result += "Entry Module: " + longEntry.GetName() + "\n";
            ShowModuleEvents(longEntry, result);
            result += "------------------------------------\n";
        }
        
        CStrategyModule* longInvalidation = GetModule(MODULE_TYPE_INVALIDATION, true);
        if(longInvalidation != NULL)
        {
            result += "Invalidation Module: " + longInvalidation.GetName() + "\n";
            ShowModuleEvents(longInvalidation, result);
            result += "------------------------------------\n";
        }
        
        if(m_longValidations != NULL && m_longValidations.Total() > 0)
        {
            result += "Validations:\n";
            result += GetLongValidationDescription() + "\n";
            result += "------------------------------------\n";
        }
    }
    
    if(HasShortStrategy())
    {
        result += "SHORT STRATEGY:\n";
        result += "------------------------------------\n";
        
        CStrategyModule* shortSetup = GetModule(MODULE_TYPE_SETUP, false);
        if(shortSetup != NULL)
        {
            result += "Setup Module: " + shortSetup.GetName() + "\n";
            ShowModuleEvents(shortSetup, result);
            result += "------------------------------------\n";
        }
        
        CStrategyModule* shortEntry = GetModule(MODULE_TYPE_ENTRY, false);
        if(shortEntry != NULL)
        {
            result += "Entry Module: " + shortEntry.GetName() + "\n";
            ShowModuleEvents(shortEntry, result);
            result += "------------------------------------\n";
        }
        
        CStrategyModule* shortInvalidation = GetModule(MODULE_TYPE_INVALIDATION, false);
        if(shortInvalidation != NULL)
        {
            result += "Invalidation Module: " + shortInvalidation.GetName() + "\n";
            ShowModuleEvents(shortInvalidation, result);
            result += "------------------------------------\n";
        }
        
        if(m_shortValidations != NULL && m_shortValidations.Total() > 0)
        {
            result += "Validations:\n";
            result += GetShortValidationDescription() + "\n";
            result += "------------------------------------\n";
        }
    }
    
    result += "====================================\n";
    return result;
}

void CStrategy::ShowModuleEvents(CStrategyModule* module, string &result)
{
    if(module == NULL) return;
    
    result += "  Parameters:\n";
    string paramNames[];
    module.GetParameterNames(paramNames);
    for(int i = 0; i < ArraySize(paramNames); i++)
    {
        result += "    " + paramNames[i] + " = " + module.GetParameterValue(paramNames[i]) + "\n";
    }
    
    result += "  Events:\n";
    for(int i = 0; i < module.GetStepCount(); i++)
    {
        CStrategyStep* step = module.GetStep(i);
        if(step != NULL)
        {
            string resolvedEventName = step.GetEventName(0, module.GetParameterNames(), module.GetParameterValues());
                    
            // Berücksichtige ob es eine Invalidierung ist
            string stepType = step.IsInvalidation() ? "Invalidation" : "Event";
            result += StringFormat("    %s %d: %s\n", stepType, i + 1, resolvedEventName);
            result += StringFormat("      Template: %s\n", step.GetEventNameTemplate());
            result += StringFormat("      Details: %s\n", step.GetDetails(module.GetParameterNames(), module.GetParameterValues()));
        }
    }
}

bool CStrategy::HasLongStrategy() const
{
    return (GetLongSetup() != NULL && GetLongEntry() != NULL);
}

bool CStrategy::HasShortStrategy() const
{
    return (GetShortSetup() != NULL && GetShortEntry() != NULL);
}

bool CStrategy::IsLongCompleted() const
{
    if(!HasLongStrategy()) 
        return false;
        
    CModuleState* setupState = GetLongSetupState();
    CModuleState* entryState = GetLongEntryState();
    CStrategyModule* setupModule = GetLongSetup();
    CStrategyModule* entryModule = GetLongEntry();
    
    bool completed = (setupState.IsCompleted(setupModule.GetStepCount()) && 
                     entryState.IsCompleted(entryModule.GetStepCount()));
                     
    return completed;
}

bool CStrategy::IsShortCompleted() const
{
    if(!HasShortStrategy()) 
        return false;
        
    CModuleState* setupState = GetShortSetupState();
    CModuleState* entryState = GetShortEntryState();
    CStrategyModule* setupModule = GetShortSetup();
    CStrategyModule* entryModule = GetShortEntry();
    
    bool completed = (setupState.IsCompleted(setupModule.GetStepCount()) && 
                     entryState.IsCompleted(entryModule.GetStepCount()));
                     
    return completed;
}

int CStrategy::LongStepCount() const
{
    int count = 0;
    CStrategyModule* setupModule = GetLongSetup();
    CStrategyModule* entryModule = GetLongEntry();
    
    if(setupModule != NULL) count += setupModule.GetStepCount();
    if(entryModule != NULL) count += entryModule.GetStepCount();
    return count;
}

int CStrategy::ShortStepCount() const
{
    int count = 0;
    CStrategyModule* setupModule = GetShortSetup();
    CStrategyModule* entryModule = GetShortEntry();
    
    if(setupModule != NULL) count += setupModule.GetStepCount();
    if(entryModule != NULL) count += entryModule.GetStepCount();
    return count;
}

CStrategyStep* CStrategy::GetLongStep(int index) const
{
    CStrategyModule* setupModule = GetLongSetup();
    CStrategyModule* entryModule = GetLongEntry();
    
    if(setupModule == NULL || entryModule == NULL) 
        return NULL;
    
    int setupCount = setupModule.GetStepCount();
    if(index < setupCount)
        return setupModule.GetStep(index);
    else
        return entryModule.GetStep(index - setupCount);
}

CStrategyStep* CStrategy::GetShortStep(int index) const
{
    CStrategyModule* setupModule = GetShortSetup();
    CStrategyModule* entryModule = GetShortEntry();
    
    if(setupModule == NULL || entryModule == NULL) 
        return NULL;
    
    int setupCount = setupModule.GetStepCount();
    if(index < setupCount)
        return setupModule.GetStep(index);
    else
        return entryModule.GetStep(index - setupCount);
}

CStrategyStep* CStrategy::GetCurrentLongStep() const
{
    CModuleState* setupState = GetLongSetupState();
    CModuleState* entryState = GetLongEntryState();
    CStrategyModule* setupModule = GetLongSetup();
    CStrategyModule* entryModule = GetLongEntry();
    
    if(setupModule == NULL || setupState == NULL) 
        return NULL;
    
    if(!setupState.IsCompleted(setupModule.GetStepCount()))
    {
        // Finde ersten nicht abgeschlossenen Step im Setup
        for(int i = 0; i < setupModule.GetStepCount(); i++)
        {
            if(!setupState.IsStepCompleted(i))
                return setupModule.GetStep(i);
        }
    }
    else if(entryModule != NULL && entryState != NULL && 
            !entryState.IsCompleted(entryModule.GetStepCount()))
    {
        // Finde ersten nicht abgeschlossenen Step im Entry
        for(int i = 0; i < entryModule.GetStepCount(); i++)
        {
            if(!entryState.IsStepCompleted(i))
                return entryModule.GetStep(i);
        }
    }
    return NULL;
}

CStrategyStep* CStrategy::GetCurrentShortStep() const
{
    CModuleState* setupState = GetShortSetupState();
    CModuleState* entryState = GetShortEntryState();
    CStrategyModule* setupModule = GetShortSetup();
    CStrategyModule* entryModule = GetShortEntry();
    
    if(setupModule == NULL || setupState == NULL) 
        return NULL;
    
    if(!setupState.IsCompleted(setupModule.GetStepCount()))
    {
        // Finde ersten nicht abgeschlossenen Step im Setup
        for(int i = 0; i < setupModule.GetStepCount(); i++)
        {
            if(!setupState.IsStepCompleted(i))
                return setupModule.GetStep(i);
        }
    }
    else if(entryModule != NULL && entryState != NULL && 
            !entryState.IsCompleted(entryModule.GetStepCount()))
    {
        // Finde ersten nicht abgeschlossenen Step im Entry
        for(int i = 0; i < entryModule.GetStepCount(); i++)
        {
            if(!entryState.IsStepCompleted(i))
                return entryModule.GetStep(i);
        }
    }
    return NULL;
}

void CStrategy::AddLongEvent(CEvent* event)
{
    CArrayObj* events = GetModuleEvents(MODULE_TYPE_ENTRY, true);
    if(events != NULL)
        events.Add(event);
}

void CStrategy::AddShortEvent(CEvent* event)
{
    CArrayObj* events = GetModuleEvents(MODULE_TYPE_ENTRY, false);
    if(events != NULL)
        events.Add(event);
}

void CStrategy::ResetLongExecution()
{
    for(int i = 0; i < m_longModules.Total(); i++)
    {
        CModuleData* data = m_longModules.At(i);
        if(data.state != NULL)
            data.state.Reset();
            
        if(data.events != NULL)
        {
            while(data.events.Total() > 0)
                data.events.Detach(0);
        }
    }
}

void CStrategy::ResetShortExecution()
{
    for(int i = 0; i < m_shortModules.Total(); i++)
    {
        CModuleData* data = m_shortModules.At(i);
        if(data.state != NULL)
            data.state.Reset();
            
        if(data.events != NULL)
        {
            while(data.events.Total() > 0)
                data.events.Detach(0);
        }
    }
}

void CStrategy::ResetLongEntry()
{
    CModuleState* state = GetModuleState(MODULE_TYPE_ENTRY, true);
    if(state != NULL)
        state.Reset();
}

void CStrategy::ResetShortEntry()
{
    CModuleState* state = GetModuleState(MODULE_TYPE_ENTRY, false);
    if(state != NULL)
        state.Reset();
}

void CStrategy::Reset()
{
    ResetLongExecution();
    ResetShortExecution();
}

void CStrategy::GetUsedModuleNames(string &moduleNames[])
{
    ArrayFree(moduleNames);
    int totalModules = m_longModules.Total() + m_shortModules.Total();
    ArrayResize(moduleNames, totalModules);
    int currentIndex = 0;
    
    // Long Module
    for(int i = 0; i < m_longModules.Total(); i++)
    {
        CModuleData* data = m_longModules.At(i);
        if(data.module != NULL)
            moduleNames[currentIndex++] = data.module.GetName();
    }
    
    // Short Module
    for(int i = 0; i < m_shortModules.Total(); i++)
    {
        CModuleData* data = m_shortModules.At(i);
        if(data.module != NULL)
            moduleNames[currentIndex++] = data.module.GetName();
    }
}

#endif


