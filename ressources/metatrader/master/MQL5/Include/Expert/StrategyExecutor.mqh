#ifndef STRATEGY_EXECUTOR_MQH
#define STRATEGY_EXECUTOR_MQH

#include <Arrays\ArrayObj.mqh>
#include <Expert\Strategy.mqh>
#include <Expert\Event.mqh>
#include <Expert\StrategyStep.mqh>
#include <Expert\TradeSignal.mqh>
#include <Expert\StrategyModule.mqh>
#include <Expert\ModuleState.mqh>
#include <Expert\AwesomeExpert.mqh>
#include <Expert\LogManager.mqh>
#include <Expert\EventHandler.mqh>
#include <Expert\ImbalanceEventHandler.mqh>
#include <Expert\AppClient.mqh>

class CStrategyExecutor : public CObject
{
private:
    CArrayObj m_strategies;
    CTradeSignal* m_lastTradeSignal;
    CArrayString* m_handlerKeys;
    CArrayObj* m_eventHandlers;
    
public:
    CStrategyExecutor();
    ~CStrategyExecutor();

    void AddStrategy(CStrategy* strategy);
    void RemoveStrategy(CStrategy* strategy);
    int GetStrategiesCount() const;
    CStrategy* GetStrategyByIndex(int index) const;
    void ResetExecution();
    bool ProcessEvents(CArrayObj* events);
    CTradeSignal* GenerateTradeSignal(CStrategy* strategy);

private:
    bool ProcessEventsForStrategy(CStrategy* strategy, CArrayObj* events, bool&wasInvalidated);
    bool ProcessEventsForStrategyInvalidation(CStrategy* strategy, CArrayObj* events);
    bool ProcessEventsForDirection(CStrategy* strategy, CArrayObj* events, bool isLong, bool&wasInvalidated);
    bool ProcessModuleEvents(CStrategyModule* module, CModuleState* state, CArrayObj* events, CStrategy* strategy, bool isLong);
    CEvent* FindLastRelevantEvent(CArrayObj* events, CStrategy* strategy);
    bool EventMatchesStep(CEvent* event, CStrategyStep* step, CStrategyModule* module);
    CStrategyModule* FindModuleForStep(CStrategyStep* step, CStrategy* strategy, bool &isLong);
    CStrategyStep* GetNextNotCompletedStep(CStrategyModule* module, CModuleState* state);
    bool CheckForInvalidation(CStrategyModule* module, CArrayObj* events);
    bool ValidateConditionsForDirection(CStrategy* strategy, bool isLong);
    CEventHandler* GetEventHandler(CStrategy* strategy, bool isLong);
    void CleanupEventHandlers(CStrategy* strategy);
    void InitializeEventHandlers(CStrategy* strategy);
    int GetLastCompletedStepIndex(CModuleState* state) const;
};

CStrategyExecutor::CStrategyExecutor() : m_lastTradeSignal(NULL) {
    m_handlerKeys = new CArrayString;
    m_eventHandlers = new CArrayObj;
}

CStrategyExecutor::~CStrategyExecutor()
{
    if(m_lastTradeSignal != NULL)
    {
        delete m_lastTradeSignal;
    }
    delete m_handlerKeys;
    delete m_eventHandlers;
}

void CStrategyExecutor::AddStrategy(CStrategy* strategy)
{
    if(strategy != NULL)
    {
        m_strategies.Add(strategy);
        strategy.Reset();
        InitializeEventHandlers(strategy);
        Print("Added strategy to executor:\n", strategy.ToString());
    }
}

void CStrategyExecutor::RemoveStrategy(CStrategy* strategy)
{
    for(int i = 0; i < m_strategies.Total(); i++)
    {
        if(m_strategies.At(i) == strategy)
        {
            CleanupEventHandlers(strategy);
            m_strategies.Detach(i);
            break;
        }
    }
}

int CStrategyExecutor::GetStrategiesCount() const
{
    return m_strategies.Total();
}

CStrategy* CStrategyExecutor::GetStrategyByIndex(int index) const
{
    if(index >= 0 && index < m_strategies.Total())
        return m_strategies.At(index);
    return NULL;
}

bool CStrategyExecutor::ProcessEvents(CArrayObj* events)
{
    bool anyEventProcessed = false;
    
    // Temporäres Array für die Events der aktuellen Strategie
    CArrayObj* strategyEvents = new CArrayObj();
    
    for(int i = 0; i < m_strategies.Total(); i++)
    {
        CStrategy* strategy = m_strategies.At(i);
        bool continueProcessing = true;
        
        // Array für aktuelle Strategie initialisieren - sollte zu diesem Zeitpunkt leer sein
        for(int e = 0; e < events.Total(); e++)
        {
            strategyEvents.Add(events.At(e));
        }
        
        while(continueProcessing)
        {
            bool currentStrategyInvalidated = false;
            if(ProcessEventsForStrategy(strategy, strategyEvents, currentStrategyInvalidated))
            {
                anyEventProcessed = true;
            }
            else
            {
                continueProcessing = false;
            }
            
            if (strategy_allow_parallel_steps == false)
                continueProcessing = false;
        }
        
        // Events für nächste Strategie freigeben
        while(strategyEvents.Total() > 0)
        {
            strategyEvents.Detach(0);
        }
        
        ProcessEventsForStrategyInvalidation(m_strategies.At(i),events);
    }
    
    
    delete strategyEvents;
    return anyEventProcessed;
}

bool CStrategyExecutor::ProcessEventsForStrategy(CStrategy* strategy, CArrayObj* events, bool&wasInvalidated)
{
    bool strategyUpdated = false;
    if (events.Total()>0)
    {
       string range = "from "+((CEvent*)events.At(0)).id+" to "+((CEvent*)events.At(events.Total()-1)).id;
       CLogManager::GetInstance().LogMessage("CStrategyExecutor::ProcessEventsForStrategy",LL_DEBUG,"Process Events "+range);    
    }
    
    // Verarbeite Long-Strategie
    if(strategy.HasLongStrategy() && !strategy.IsLongCompleted())
    {
        strategyUpdated |= ProcessEventsForDirection(strategy, events, true, wasInvalidated);
    }

    // Verarbeite Short-Strategie
    if(strategy.HasShortStrategy() && !strategy.IsShortCompleted())
    {
        strategyUpdated |= ProcessEventsForDirection(strategy, events, false, wasInvalidated);
    }

    return strategyUpdated;
}

bool CStrategyExecutor::ProcessEventsForDirection(CStrategy* strategy, CArrayObj* events, bool isLong, bool&wasInvalidated)
{
    bool strategyUpdated = false;
    
    // Hole Setup/Entry Module und States
    CStrategyModule* setupModule = isLong ? strategy.GetLongSetup() : strategy.GetShortSetup();
    CStrategyModule* entryModule = isLong ? strategy.GetLongEntry() : strategy.GetShortEntry();
    CModuleState* setupState = isLong ? strategy.GetLongSetupState() : strategy.GetShortSetupState();
    CModuleState* entryState = isLong ? strategy.GetLongEntryState() : strategy.GetShortEntryState();

    // Verarbeite Setup Events wenn nicht abgeschlossen
    if(setupModule != NULL && !setupState.IsCompleted(setupModule.GetStepCount()))
    {
        CLogManager::GetInstance().LogMessage("CStrategyExecutor::ProcessEventsForDirection",LL_DEBUG,
            StringFormat("Processing setup steps for %s direction", isLong ? "long" : "short"));
            
        CStrategyStep* currentStep = GetNextNotCompletedStep(setupModule, setupState);  
        if(ProcessModuleEvents(setupModule, setupState, events, strategy, isLong))
        {
            strategyUpdated = true;
            
            // Wenn Setup gerade abgeschlossen wurde -> Benachrichtigung senden
            if(setupState.IsCompleted(setupModule.GetStepCount()))
            {
               string desc = "";
               CArrayObj* completionEvents = setupState.GetCompletionEvents();
               for(int i=0; i<completionEvents.Total(); i++)
               {
                   CEvent* e = completionEvents.At(i);
                   if(e != NULL)
                     desc += "Step " + IntegerToString(i+1) + ": " + e.GetDetails() + "\n"; 
               }
               
               string direction = isLong ? "Long" : "Short";
               CAppClient::GetInstance().SendSetup(strategy.Name, direction, desc);
               CLogManager::GetInstance().LogMessage("CStrategyExecutor", LL_INFO, "Setup Notification sent for " + strategy.Name + " " + direction);
            }
        }
    }
    // Setup ist abgeschlossen, verarbeite Entry Events
    else if(setupModule != NULL && setupState.IsCompleted(setupModule.GetStepCount()))
    {
        if(entryModule != NULL && !entryState.IsCompleted(entryModule.GetStepCount()))
        {
            CLogManager::GetInstance().LogMessage("CStrategyExecutor::ProcessEventsForDirection",LL_DEBUG,
                StringFormat("Processing entry steps for %s direction", isLong ? "long" : "short"));
                
            if(ProcessModuleEvents(entryModule, entryState, events, strategy, isLong))
            {
                strategyUpdated = true;
                Print("Entry step completed");
            }
        }
    }


    if (setupModule != NULL && setupState.IsCompleted(setupModule.GetStepCount()) && 
        entryModule != NULL && entryState.IsCompleted(entryModule.GetStepCount()))
    {
        CLogManager::GetInstance().LogMessage("CStrategyExecutor::ProcessEventsForDirection",LL_DEBUG,
            "All steps completed, validating conditions");
            
        if(ValidateConditionsForDirection(strategy, isLong) == false)
        {
            setupState.Reset();
            entryState.Reset();
            strategyUpdated = false;
            
            CLogManager::GetInstance().LogMessage("CStrategyExecutor::ProcessEventsForDirection",LL_DEBUG,
                "Validation failed - resetting states");
        }
    }

    return strategyUpdated;
}

CStrategyStep* CStrategyExecutor::GetNextNotCompletedStep(CStrategyModule* module, CModuleState* state)
{
    if(module == NULL || state == NULL)
        return NULL;

    // Berücksichtige nur nicht-Invalidierungs-Steps        
    for(int i = state.GetLastCompletedEventIndex() + 1; i < module.GetStepCount(); i++)
    {
        CStrategyStep* step = module.GetStep(i);
        if(step != NULL && !step.IsInvalidation())
        {
            return step;
        }
    }
    
    return NULL;
}

bool CStrategyExecutor::ValidateConditionsForDirection(CStrategy* strategy, bool isLong)
{
    if(isLong)
    {
        if(strategy.ValidateLongConditions() == false)
        {
            string details = strategy.GetLongValidationDetails();
            CLogManager::GetInstance().LogMessage("CStrategyExecutor::ValidateConditionsForDirection",
                LL_INFO,
                StringFormat("Strategy '%s' Long conditions not met: %s", 
                    strategy.Name, 
                    details));
            return false;
        }
    }
    else
    {
        if(strategy.ValidateShortConditions() == false)
        {
            string details = strategy.GetShortValidationDetails();
            CLogManager::GetInstance().LogMessage("CStrategyExecutor::ValidateConditionsForDirection",
                LL_INFO,
                StringFormat("Strategy '%s' Short conditions not met: %s", 
                    strategy.Name, 
                    details));
            return false;
        }
    }
    
    return true;
}

void CStrategyExecutor::InitializeEventHandlers(CStrategy* strategy)
{
    if(strategy.HasLongStrategy())
    {
        string longKey = StringFormat("%s_LONG", strategy.Name);
        CEventHandler* longHandler = new CImbalanceEventHandler(strategy.Name, true);
        m_handlerKeys.Add(longKey);
        m_eventHandlers.Add(longHandler);
    }

    if(strategy.HasShortStrategy())
    {
        string shortKey = StringFormat("%s_SHORT", strategy.Name);
        CEventHandler* shortHandler = new CImbalanceEventHandler(strategy.Name, false);
        m_handlerKeys.Add(shortKey);
        m_eventHandlers.Add(shortHandler);
    }
}

void CStrategyExecutor::CleanupEventHandlers(CStrategy* strategy)
{
    string longKey = StringFormat("%s_LONG", strategy.Name);
    string shortKey = StringFormat("%s_SHORT", strategy.Name);

    // Von hinten nach vorne durchgehen für sicheres Löschen
    for(int i = m_handlerKeys.Total() - 1; i >= 0; i--)
    {
        if(m_handlerKeys.At(i) == longKey || m_handlerKeys.At(i) == shortKey)
        {
            delete m_eventHandlers.At(i);
            m_eventHandlers.Delete(i);
            m_handlerKeys.Delete(i);
        }
    }
}

CEventHandler* CStrategyExecutor::GetEventHandler(CStrategy* strategy, bool isLong)
{
    string key = StringFormat("%s_%s", strategy.Name, isLong ? "LONG" : "SHORT");
    
    for(int i = 0; i < m_handlerKeys.Total(); i++)
    {
        if(m_handlerKeys.At(i) == key)
            return m_eventHandlers.At(i);
    }
    return NULL;
}

int CStrategyExecutor::GetLastCompletedStepIndex(CModuleState* state) const
{
    int lastCompleted = -1;
    for(int i = 0; state.IsStepCompleted(i); i++)
    {
        lastCompleted = i;
    }
    return lastCompleted;
}

bool CStrategyExecutor::ProcessEventsForStrategyInvalidation(CStrategy* strategy, CArrayObj* events)
{
    bool strategyUpdated = false;
    
    // Long-Invalidierung prüfen
    CStrategyModule* longInvalidation = strategy.GetModule(MODULE_TYPE_INVALIDATION, true);
    if(longInvalidation != NULL)
    {
        CModuleState* invalidationState = strategy.GetModuleState(MODULE_TYPE_INVALIDATION, true);
        if(longInvalidation.ProcessEvents(events, invalidationState))
        {
            // Invalidierung trat ein
            strategy.ResetLongExecution();
            invalidationState.Reset();
            
            CTradeInfo* tradeInfo = new CTradeInfo();
            tradeInfo.strategyName = strategy.Name;
            tradeInfo.direction = 1;
            
            CTradeEvent* invalidationEvent = new CTradeEvent(
                _Symbol,
                EV_TRADE_SETUP_INVALIDATED,
                tradeInfo,
                0,
                tradeInfo.IsLong(),
                tradeInfo.strategyName,
                tradeInfo.ticket,
                tradeInfo.orderOpenTime,
                tradeInfo.pips_profit,
                "Setup invalidated"
            );
            
            CLogManager::GetInstance().LogMessage("CStrategyExecutor::ProcessEventsForStrategyInvalidation",
                LL_INFO,
                StringFormat("Strategy '%s' Long setup invalidated", strategy.Name));
            
            CEventStore::GetInstance(_Symbol).AddEvent(invalidationEvent);
            strategyUpdated = true;
        }
    }
    
    // Short-Invalidierung analog
    CStrategyModule* shortInvalidation = strategy.GetModule(MODULE_TYPE_INVALIDATION, false);
    if(shortInvalidation != NULL)
    {
        CModuleState* invalidationState = strategy.GetModuleState(MODULE_TYPE_INVALIDATION, false);
        if(shortInvalidation.ProcessEvents(events, invalidationState))
        {
            strategy.ResetShortExecution();
            invalidationState.Reset();
            
            CTradeInfo* tradeInfo = new CTradeInfo();
            tradeInfo.strategyName = strategy.Name;
            tradeInfo.direction = -1;
            
            CTradeEvent* invalidationEvent = new CTradeEvent(
                _Symbol,
                EV_TRADE_SETUP_INVALIDATED,
                tradeInfo,
                0,
                tradeInfo.IsLong(),
                tradeInfo.strategyName,
                tradeInfo.ticket,
                tradeInfo.orderOpenTime,
                tradeInfo.pips_profit,
                "Setup invalidated"
            );
            
            CLogManager::GetInstance().LogMessage("CStrategyExecutor::ProcessEventsForStrategyInvalidation",
                LL_INFO,
                StringFormat("Strategy '%s' Short setup invalidated", strategy.Name));
            
            CEventStore::GetInstance(_Symbol).AddEvent(invalidationEvent);
            strategyUpdated = true;
        }
    }
    
    return strategyUpdated;
}

bool CStrategyExecutor::ProcessModuleEvents(CStrategyModule* module, CModuleState* state, CArrayObj* events, CStrategy* strategy, bool isLong)
{
    if(module == NULL || state == NULL)
        return false;

    CLogManager::GetInstance().LogMessage("CStrategyExecutor::ProcessModuleEvents",LL_DEBUG,
        StringFormat("Processing events for module %s (isLong: %s)", 
            module.GetName(), isLong ? "true" : "false"));

    bool moduleUpdated = false;
    
    // Prüfe aktive Invalidierungen
    int lastEventIndex = state.GetLastCompletedEventIndex();
    int invalidationStartIndex = state.GetActiveInvalidationStartIndex();
    
    if(invalidationStartIndex >= 0)
    {
        CLogManager::GetInstance().LogMessage("CStrategyExecutor::ProcessModuleEvents",LL_DEBUG,
            StringFormat("Checking invalidations starting from index %d", invalidationStartIndex));
            
        // Prüfe alle aktiven Invalidierungen
        for(int i = invalidationStartIndex; i < module.GetStepCount(); i++)
        {
            CStrategyStep* step = module.GetStep(i);
            if(!step.IsInvalidation())
                continue;
                
            for(int j = events.Total() - 1; j >= 0; j--)
            {
                CEvent* event = events.At(j);
                bool eventMatched = false;
                bool handlerFound = false;
                
                // Prüfe alle verfügbaren Handler
                CEventHandler* handler = GetEventHandler(strategy, isLong);
                if(handler != NULL)
                {
                    if(handler.CanHandleEvent(event))
                    {
                        handlerFound = true;
                        eventMatched = handler.HandleEvent(event, step, module);
                    }
                }
                
                if(!handlerFound)
                {
                    eventMatched = EventMatchesStep(event, step, module);
                }
                
                if(eventMatched)
                {
                    CLogManager::GetInstance().LogMessage("CStrategyExecutor::ProcessModuleEvents",LL_INFO,
                        StringFormat("Strategy '%s' %s module '%s' invalidated by event %s", 
                            strategy.Name,
                            isLong ? "Long" : "Short",
                            module.GetName(),
                            event.GetDetails()));
                    state.Reset();
                    return true;
                }
            }
        }
    }
    
    // Verarbeite das nächste nicht komplettierte Event
    for(int i = lastEventIndex + 1; i < module.GetStepCount(); i++)
    {
        CStrategyStep* step = module.GetStep(i);
        
        // Überspringe Invalidierungen bei der Event-Verarbeitung
        if(step.IsInvalidation())
            continue;
            
        CLogManager::GetInstance().LogMessage("CStrategyExecutor::ProcessModuleEvents",LL_DEBUG,
            StringFormat("Processing event at index %d", i));
            
        for(int j = events.Total() - 1; j >= 0; j--)
        {
            CEvent* event = events.At(j);
            bool eventMatched = false;
            bool handlerFound = false;
            
            // Prüfe alle verfügbaren Handler
            CEventHandler* handler = GetEventHandler(strategy, isLong);
            if(handler != NULL)
            {
                if(handler.CanHandleEvent(event))
                {
                    handlerFound = true;
                    eventMatched = handler.HandleEvent(event, step, module);
                }
            }
            
            if(!handlerFound)
            {
                eventMatched = EventMatchesStep(event, step, module);
            }
        
            if(eventMatched)
            {
                state.SetStepCompleted(i, event);
                moduleUpdated = true;
                
                CLogManager::GetInstance().LogMessage("CStrategyExecutor::ProcessModuleEvents",LL_INFO,
                    StringFormat("Strategy '%s' %s module '%s' completed step %d with event %s", 
                        strategy.Name,
                        isLong ? "Long" : "Short",
                        module.GetName(),
                        i,
                        event.GetDetails()));
                
                events.Detach(j);
                break;
            }
        }
        
        // Wenn das Event nicht completed wurde, brechen wir ab
        if(!state.IsStepCompleted(i))
            break;
    }

    return moduleUpdated;
}

bool CStrategyExecutor::EventMatchesStep(CEvent* event, CStrategyStep* step, CStrategyModule* module)
{
    if(event == NULL || step == NULL || module == NULL)
        return false;

    return step.MatchesEvent(event, module.GetParameterNames(), module.GetParameterValues());
}

CStrategyModule* CStrategyExecutor::FindModuleForStep(CStrategyStep* step, CStrategy* strategy, bool &isLong)
{
    // Prüfe Long Setup
    CStrategyModule* longSetup = strategy.GetLongSetup();
    if(longSetup != NULL)
    {
        for(int i = 0; i < longSetup.GetStepCount(); i++)
        {
            if(longSetup.GetStep(i) == step)
            {
                isLong = true;
                return longSetup;
            }
        }
    }
    
    // Prüfe Long Entry
    CStrategyModule* longEntry = strategy.GetLongEntry();
    if(longEntry != NULL)
    {
        for(int i = 0; i < longEntry.GetStepCount(); i++)
        {
            if(longEntry.GetStep(i) == step)
            {
                isLong = true;
                return longEntry;
            }
        }
    }
    
    // Prüfe Short Setup
    CStrategyModule* shortSetup = strategy.GetShortSetup();
    if(shortSetup != NULL)
    {
        for(int i = 0; i < shortSetup.GetStepCount(); i++)
        {
            if(shortSetup.GetStep(i) == step)
            {
                isLong = false;
                return shortSetup;
            }
        }
    }
    
    // Prüfe Short Entry
    CStrategyModule* shortEntry = strategy.GetShortEntry();
    if(shortEntry != NULL)
    {
        for(int i = 0; i < shortEntry.GetStepCount(); i++)
        {
            if(shortEntry.GetStep(i) == step)
            {
                isLong = false;
                return shortEntry;
            }
        }
    }
    
    return NULL;
}

CTradeSignal* CStrategyExecutor::GenerateTradeSignal(CStrategy* strategy)
{
    CEvent* lastEvent = NULL;
    bool isLong = strategy.IsLongCompleted();
    
    // Hole letztes Event aus dem Entry-Modul
    if(isLong && strategy.GetLongEntryState() != NULL)
    {
        CArrayObj* moduleEvents = strategy.GetLongEntryState().GetCompletionEvents();
        if(moduleEvents.Total() > 0)
            lastEvent = moduleEvents.At(moduleEvents.Total()-1);
    }
    else if(!isLong && strategy.GetShortEntryState() != NULL)
    {
        CArrayObj* moduleEvents = strategy.GetShortEntryState().GetCompletionEvents();
        if(moduleEvents.Total() > 0)
            lastEvent = moduleEvents.At(moduleEvents.Total()-1);
    }
    
    CLogManager::GetInstance().LogMessage("CStrategyExecutor::GenerateTradeSignal",LL_DEBUG,"Last Entry Event = "+lastEvent.toString());
    
    if(lastEvent != NULL && lastEvent.IsSignalEvent())
    {
        if(m_lastTradeSignal != NULL)
        {
            delete m_lastTradeSignal;
        }
        m_lastTradeSignal = new CTradeSignal();
        lastEvent.FillTradeSignal(*m_lastTradeSignal);
        m_lastTradeSignal.m_description = lastEvent.GetDetails();
        
        Print("New trade signal created: Entry=", m_lastTradeSignal.GetEntryPrice(), 
              ", SL=", m_lastTradeSignal.GetStopLoss(), 
              ", TP=", m_lastTradeSignal.GetTakeProfit());
    }
    else if(m_lastTradeSignal == NULL)
    {
        m_lastTradeSignal = new CTradeSignal();
        if(lastEvent != NULL)
            m_lastTradeSignal.m_description = lastEvent.GetDetails();
    }
    
    return m_lastTradeSignal;
}


void CStrategyExecutor::ResetExecution()
{
    for(int i = 0; i < m_strategies.Total(); i++)
    {
        CStrategy* strategy = m_strategies.At(i);
        strategy.Reset();
        
        CEventHandler* longHandler = GetEventHandler(strategy, true);
        if(longHandler != NULL) longHandler.Reset();
        
        CEventHandler* shortHandler = GetEventHandler(strategy, false);
        if(shortHandler != NULL) shortHandler.Reset();
    }
}

#endif

