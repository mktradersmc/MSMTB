//+------------------------------------------------------------------+
//|                                                StrategyState.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "1.00"

#ifndef STRATEGY_STATE_MQH
#define STRATEGY_STATE_MQH

#include <Object.mqh>
#include <Arrays/ArrayString.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Expert\EventHandler.mqh>
#include <Expert\LogManager.mqh>

class CStrategyState : public CObject
{
private:
    string m_strategyName;
    CArrayString* m_moduleNames;     // Namen der Module
    CArrayObj* m_eventHandlers;      // Event Handler pro Modul
    
public:
    CStrategyState(const string& strategyName);
    ~CStrategyState();
    
    // Getter & Setter
    string GetStrategyName() const { return m_strategyName; }
    
    // Event Handler Management
    void RegisterEventHandler(const string& moduleName, CEventHandler* handler);
    void UnregisterEventHandler(const string& moduleName);
    CEventHandler* GetEventHandler(const string& moduleName);
    void ClearEventHandlers();
    
private:
    int FindModuleIndex(const string& moduleName) const;
};

CStrategyState::CStrategyState(const string& strategyName)
    : m_strategyName(strategyName)
{
    m_moduleNames = new CArrayString();
    m_eventHandlers = new CArrayObj();
}

CStrategyState::~CStrategyState()
{
    ClearEventHandlers();
    delete m_moduleNames;
    delete m_eventHandlers;
}

void CStrategyState::RegisterEventHandler(const string& moduleName, CEventHandler* handler)
{
    if(handler == NULL)
        return;
        
    int existingIndex = FindModuleIndex(moduleName);
    if(existingIndex != -1)
    {
        // Update existing handler
        delete m_eventHandlers.At(existingIndex);
        m_eventHandlers.Update(existingIndex, handler);
    }
    else
    {
        m_moduleNames.Add(moduleName);
        m_eventHandlers.Add(handler);
    }
    
    CLogManager::GetInstance().LogMessage("CStrategyState::RegisterEventHandler", 
        LL_DEBUG, StringFormat("Registered %s for module %s", handler.GetEventHandlerName(), moduleName));
}

void CStrategyState::UnregisterEventHandler(const string& moduleName)
{
    int index = FindModuleIndex(moduleName);
    if(index != -1)
    {
        delete m_eventHandlers.Detach(index);
        m_moduleNames.Delete(index);
        
        CLogManager::GetInstance().LogMessage("CStrategyState::UnregisterEventHandler", 
            LL_DEBUG, StringFormat("Unregistered handler for module %s", moduleName));
    }
}

CEventHandler* CStrategyState::GetEventHandler(const string& moduleName)
{
    int index = FindModuleIndex(moduleName);
    if(index != -1)
        return m_eventHandlers.At(index);
    return NULL;
}

void CStrategyState::ClearEventHandlers()
{
    for(int i = m_eventHandlers.Total() - 1; i >= 0; i--)
    {
        delete m_eventHandlers.At(i);
    }
    m_moduleNames.Clear();
    m_eventHandlers.Clear();
    
    CLogManager::GetInstance().LogMessage("CStrategyState::ClearEventHandlers", 
        LL_DEBUG, "Cleared all event handlers");
}

int CStrategyState::FindModuleIndex(const string& moduleName) const
{
    for(int i = 0; i < m_moduleNames.Total(); i++)
    {
        if(m_moduleNames.At(i) == moduleName)
            return i;
    }
    return -1;
}

#endif

