#property copyright "Copyright 2024, Michael Müller"
#property link      "https://www.mql5.com"
#property strict

#ifndef MODULE_STATE_MQH
#define MODULE_STATE_MQH

#include <Object.mqh>
#include <Arrays/ArrayInt.mqh>
#include <Arrays/ArrayObj.mqh>
#include <Expert\Event.mqh>
#include <Expert\StrategyModule.mqh>
#include <Expert\LogManager.mqh>

class CStrategyModule;

class CModuleState : public CObject
{
private:
    CStrategyModule* m_module;               // Referenz auf das Modul
    CArrayInt* m_completedSteps;             // Indizes der abgeschlossenen Steps
    CArrayObj* m_completionEvents;           // Events, die zum Abschluss führten
    int m_lastCompletedEventIndex;           // Index des letzten abgeschlossenen Events
    int m_activeInvalidationStartIndex;      // Ab diesem Index gelten Invalidierungen

public:
    CModuleState(CStrategyModule* module);
    ~CModuleState();
    
    bool IsStepCompleted(int index) const;
    int GetLastCompletedEventIndex() const { return m_lastCompletedEventIndex; }
    int GetActiveInvalidationStartIndex() const { return m_activeInvalidationStartIndex; }
    void SetStepCompleted(int index, CEvent* event);
    CEvent* GetCompletionEvent(int index) const;
    CArrayObj* GetCompletionEvents() const { return m_completionEvents; }
    bool IsCompleted(int stepCount) const;
    void Reset();
};

// Constructor
CModuleState::CModuleState(CStrategyModule* module)
{
    m_module = module;
    m_completedSteps = new CArrayInt();
    m_completionEvents = new CArrayObj();
    m_lastCompletedEventIndex = -1;
    m_activeInvalidationStartIndex = -1;
}

// Destructor
CModuleState::~CModuleState()
{
    if(CheckPointer(m_completedSteps) == POINTER_DYNAMIC)
        delete m_completedSteps;
        
    if(CheckPointer(m_completionEvents) == POINTER_DYNAMIC)
        delete m_completionEvents;
}

void CModuleState::SetStepCompleted(int index, CEvent* event)
{
    if(index < 0 || m_module == NULL) return;
    
    CStrategyStep* step = m_module.GetStep(index);
    if(step == NULL) return;
    
    CLogManager::GetInstance().LogMessage("CModuleState::SetStepCompleted",LL_DEBUG,
        StringFormat("Setting step %d completed, IsInvalidation=%s", 
            index, step.IsInvalidation() ? "true" : "false"));
    
    // Wenn es ein normales Event ist
    if(!step.IsInvalidation())
    {
        m_lastCompletedEventIndex = index;
        // Alle Invalidierungen nach diesem Event werden aktiv
        m_activeInvalidationStartIndex = index + 1;
        
        CLogManager::GetInstance().LogMessage("CModuleState::SetStepCompleted",LL_DEBUG,
            StringFormat("Updated lastCompletedEventIndex=%d, activeInvalidationStartIndex=%d", 
                m_lastCompletedEventIndex, m_activeInvalidationStartIndex));
    }
    
    m_completedSteps.Add(index);
    m_completionEvents.Add(event);
}

bool CModuleState::IsStepCompleted(int index) const
{
    if(index < 0 || m_module == NULL) return false;
    
    CStrategyStep* step = m_module.GetStep(index);
    if(step == NULL) return false;
    
    // Wenn es eine Invalidierung ist, prüfen ob sie aktiv sein sollte
    if(step.IsInvalidation())
    {
        return index >= m_activeInvalidationStartIndex;
    }
    
    // Für normale Events
    for(int i = 0; i < m_completedSteps.Total(); i++)
    {
        if(m_completedSteps.At(i) == index)
            return true;
    }
    
    return false;
}

bool CModuleState::IsCompleted(int stepCount) const
{
    if(stepCount <= 0 || m_module == NULL) return false;
    
    int completedEventCount = 0;
    int totalEventCount = 0;
    
    // Zähle nur normale Events (keine Invalidierungen)
    for(int i = 0; i < stepCount; i++)
    {
        CStrategyStep* step = m_module.GetStep(i);
        if(step == NULL) continue;
        
        if(!step.IsInvalidation())
        {
            totalEventCount++;
            if(IsStepCompleted(i))
                completedEventCount++;
        }
    }
    
    return totalEventCount > 0 && completedEventCount == totalEventCount;
}

CEvent* CModuleState::GetCompletionEvent(int index) const
{
    for(int i = 0; i < m_completedSteps.Total(); i++)
    {
        if(m_completedSteps.At(i) == index)
            return m_completionEvents.At(i);
    }
    return NULL;
}

void CModuleState::Reset()
{
    CLogManager::GetInstance().LogMessage("CModuleState::Reset",LL_DEBUG,"Resetting module state");
    
    m_completedSteps.Clear();
    while (m_completionEvents.Total() > 0)
      m_completionEvents.Detach(0);
    m_lastCompletedEventIndex = -1;
    m_activeInvalidationStartIndex = -1;
}

#endif


