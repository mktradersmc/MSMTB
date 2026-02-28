//+------------------------------------------------------------------+
//|                                        ImbalanceEventHandler.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "1.00"

#ifndef IMBALANCE_EVENT_HANDLER_MQH
#define IMBALANCE_EVENT_HANDLER_MQH

#include <Expert\EventHandler.mqh>
#include <Expert\ImbalanceStatusEvent.mqh>
#include <Expert\ImbalanceCreatedEvent.mqh>
#include <Expert\Imbalance.mqh>
#include <Expert\LogManager.mqh>
#include <Arrays/ArrayString.mqh>
#include <Arrays/ArrayLong.mqh>

class CImbalanceEventHandler : public CEventHandler
{
private:
    CArrayString* m_referenceIds;    // IDs aus der Strategiedefinition
    CArrayLong* m_imbalanceIds;      // System-IDs der tatsächlichen Imbalances
    string m_strategy;               // Name der zugehörigen Strategie
    bool m_isLong;                   // Richtung der Strategie

public:
    CImbalanceEventHandler(const string strategy, bool isLong);
    ~CImbalanceEventHandler();

    // Interface Implementation
    virtual bool HandleEvent(CEvent* event, CStrategyStep* step, CStrategyModule* module) override;
    virtual void Reset() override;
    virtual string GetName() const override { return "ImbalanceEventHandler"; }
    virtual bool CanHandleEvent(CEvent* event);

private:
    bool HandleCreatedEvent(CEvent* event, CStrategyStep* step, CStrategyModule* module);
    bool HandleStatusEvent(CEvent* event, CStrategyStep* step, CStrategyModule* module);
    string ExtractImbalanceId(CStrategyStep* step, CStrategyModule* module) const;
    void RegisterImbalanceBinding(const string& strategyId, ulong systemId);
    ulong GetImbalanceId(const string& strategyId) const;
    void LogEventProcessing(const string& message) const;
};

CImbalanceEventHandler::CImbalanceEventHandler(const string strategy, bool isLong)
    : m_strategy(strategy), m_isLong(isLong)
{
    m_referenceIds = new CArrayString();
    m_imbalanceIds = new CArrayLong();
}

CImbalanceEventHandler::~CImbalanceEventHandler()
{
    if(CheckPointer(m_referenceIds) == POINTER_DYNAMIC)
        delete m_referenceIds;
    if(CheckPointer(m_imbalanceIds) == POINTER_DYNAMIC)
        delete m_imbalanceIds;
}

void CImbalanceEventHandler::Reset()
{
    m_referenceIds.Clear();
    m_imbalanceIds.Clear();
    
    LogEventProcessing("Handler reset - all bindings cleared");
}

bool CImbalanceEventHandler::CanHandleEvent(CEvent* event)
{
    if(event == NULL) return false;
    
    // Prüfe ob es ein Imbalance-Event ist
    return dynamic_cast<CImbalanceStatusEvent*>(event) != NULL || 
           dynamic_cast<CImbalanceCreatedEvent*>(event) != NULL;
}

bool CImbalanceEventHandler::HandleEvent(CEvent* event, CStrategyStep* step, CStrategyModule* module)
{
    if(!step.MatchesEvent(event, module.GetParameterNames(), module.GetParameterValues()))
        return false;
        
    CImbalanceCreatedEvent* createdEvent = dynamic_cast<CImbalanceCreatedEvent*>(event);
    if(createdEvent != NULL)
        return HandleCreatedEvent(event, step, module);
        
    return HandleStatusEvent(event, step, module);
}

bool CImbalanceEventHandler::HandleCreatedEvent(CEvent* event, CStrategyStep* step, CStrategyModule* module)
{
    Print("ImbalanceEventHandler:HandleCreatedEvent");
    CImbalanceCreatedEvent* createdEvent = dynamic_cast<CImbalanceCreatedEvent*>(event);
    if(createdEvent == NULL)
        return false;

    string referenceId = ExtractImbalanceId(step, module);
    if(referenceId == "")
    {
        LogEventProcessing("No reference ID found in step parameters");
        return true;  // Event matched ohne ID-Prüfung
    }

    CImbalance* imbalance = createdEvent.GetImbalance();
    if(imbalance == NULL)
    {
        LogEventProcessing("No imbalance found in created event");
        return false;
    }

    RegisterImbalanceBinding(referenceId, imbalance.GetUniqueId());
    
    LogEventProcessing(StringFormat("Created binding: Reference ID %s -> System ID %d", 
        referenceId, imbalance.GetUniqueId()));
    
    return true;
}

bool CImbalanceEventHandler::HandleStatusEvent(CEvent* event, CStrategyStep* step, CStrategyModule* module)
{
    CImbalanceStatusEvent* statusEvent = dynamic_cast<CImbalanceStatusEvent*>(event);
    if(statusEvent == NULL)
    {
        LogEventProcessing("Event is not an imbalance status event");
        return false;
    }

    string referenceId = ExtractImbalanceId(step, module);
    if(referenceId == "")
    {
        LogEventProcessing("No reference ID in step parameters - event matches without ID check");
        return true;  // Event matched ohne ID-Prüfung
    }

    ulong boundImbalanceId = GetImbalanceId(referenceId);
    if(boundImbalanceId == 0)
    {
        LogEventProcessing(StringFormat("No binding found for reference ID %s", referenceId));
        return false;
    }

    CImbalance* eventImbalance = statusEvent.GetImbalance();
    if(eventImbalance == NULL)
    {
        LogEventProcessing("No imbalance found in status event");
        return false;
    }

    bool matches = (eventImbalance.GetUniqueId() == boundImbalanceId);
    
    LogEventProcessing(StringFormat("Checking status event - Reference ID: %s, Bound System ID: %d, Event System ID: %d, Matches: %s",
        referenceId, boundImbalanceId, eventImbalance.GetUniqueId(), matches ? "true" : "false"));
        
    return matches;
}

void CImbalanceEventHandler::RegisterImbalanceBinding(const string& referenceId, ulong systemId)
{
    for(int i = 0; i < m_referenceIds.Total(); i++)
    {
        if(m_referenceIds.At(i) == referenceId)
        {
            m_imbalanceIds.Update(i, (long)systemId);
            LogEventProcessing(StringFormat("Updated binding for reference ID %s to system ID %d", referenceId, systemId));
            return;
        }
    }
    
    m_referenceIds.Add(referenceId);
    m_imbalanceIds.Add((long)systemId);
    
    LogEventProcessing(StringFormat("Created new binding: Reference ID %s -> System ID %d", referenceId, systemId));
}

ulong CImbalanceEventHandler::GetImbalanceId(const string& referenceId) const
{
    for(int i = 0; i < m_referenceIds.Total(); i++)
    {
        if(m_referenceIds.At(i) == referenceId)
            return (ulong)m_imbalanceIds.At(i);
    }
    return 0;
}

string CImbalanceEventHandler::ExtractImbalanceId(CStrategyStep* step, CStrategyModule* module) const
{
   if(step == NULL || module == NULL)
       return "";

   string idTemplate = step.GetEventParameter("ID");
   if(idTemplate == "")
   {
       CLogManager::GetInstance().LogMessage("CImbalanceEventHandler::ExtractImbalanceId",
           LL_DEBUG, "No ID parameter found in step");
       return "";
   }

   string resolvedId = step.ResolveParameters(idTemplate, module.GetParameterNames(), module.GetParameterValues());
   
   CLogManager::GetInstance().LogMessage("CImbalanceEventHandler::ExtractImbalanceId",
       LL_DEBUG, 
       StringFormat("Found and resolved ID parameter: Template=%s, Resolved=%s", 
           idTemplate, 
           resolvedId)
   );
           
   return resolvedId;
}

void CImbalanceEventHandler::LogEventProcessing(const string& message) const
{
    string logMessage = StringFormat("[%s-%s] %s", 
        m_strategy, 
        m_isLong ? "LONG" : "SHORT",
        message);
        
    CLogManager::GetInstance().LogMessage("CImbalanceEventHandler", LL_DEBUG, logMessage);
}

#endif

