//+------------------------------------------------------------------+
//|                                           IConditionProvider.mqh |
//|                                  Copyright 2024, MetaQuotes Ltd. |
//|                                             https://www.mql5.com |
//+------------------------------------------------------------------+
#property copyright "Copyright 2024, MetaQuotes Ltd."
#property link      "https://www.mql5.com"
#property strict

#ifndef CONDITION_PROVIDER_MQH
#define CONDITION_PROVIDER_MQH

// Interface für Condition Provider
class IConditionProvider
{
public:
    virtual bool ValidateCondition(const string& params[]) = 0;
    virtual string GetConditionDetails(const string& params[]) = 0;
    virtual string GetConditionDescription(const string& params[]) = 0;
    virtual int GetRequiredParameterCount() = 0;
};

#endif
