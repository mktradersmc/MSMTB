//+------------------------------------------------------------------+
//|                                                 EventHandler.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property version   "1.00"

#ifndef EVENT_HANDLER_BASE_MQH
#define EVENT_HANDLER_BASE_MQH

#include <Object.mqh>
#include <Expert\Event.mqh>
#include <Expert\StrategyStep.mqh>
#include <Expert\StrategyModule.mqh>

class CEventHandler : public CObject
{
public:
    virtual bool HandleEvent(CEvent* event, CStrategyStep* step, CStrategyModule* module) = 0;
    virtual bool CanHandleEvent(CEvent* event) = 0;
    virtual void Reset() = 0;
    virtual string GetName() const = 0;
};
#endif


